import { http, HttpResponse } from "msw";

import { mockDepartments, mockDistricts } from "@/mocks/data";
import type { ApiError, ApiSuccess } from "@/types/api/api.types";
import type {
  Department,
  District,
} from "@/types/locations/location.types";

const LOCATIONS_API_PATH = "/api/v1/locations";

function parseLocationId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

function departmentNotFound() {
  const body: ApiError = {
    success: false,
    error: {
      code: "DEPARTMENT_NOT_FOUND",
      message: "Departamento no encontrado.",
    },
    timestamp: new Date().toISOString(),
  };

  return HttpResponse.json(body, { status: 404 });
}

export const locationHandlers = [
  http.get(`*${LOCATIONS_API_PATH}/departments`, () => {
    const body: ApiSuccess<Department[]> = {
      success: true,
      data: [...mockDepartments],
    };

    return HttpResponse.json(body);
  }),

  http.get(
    `*${LOCATIONS_API_PATH}/departments/:departmentId/districts`,
    ({ params }) => {
      const rawDepartmentId =
        typeof params.departmentId === "string" ? params.departmentId : "";
      const departmentId = parseLocationId(rawDepartmentId);
      const departmentExists = mockDepartments.some(
        (department) => department.id === departmentId,
      );

      if (!departmentExists) {
        return departmentNotFound();
      }

      const body: ApiSuccess<District[]> = {
        success: true,
        data: mockDistricts.filter(
          (district) => district.departmentId === departmentId,
        ),
      };

      return HttpResponse.json(body);
    },
  ),
];
