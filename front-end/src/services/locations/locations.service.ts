import { apiRequest } from "@/lib/api-client";
import type {
  Department,
  DepartmentsResponse,
  District,
  DistrictsResponse,
} from "@/types/locations/location.types";

const LOCATIONS_API_PATH = "/locations";

async function getDepartments(signal?: AbortSignal): Promise<Department[]> {
  const response = await apiRequest<DepartmentsResponse>(
    `${LOCATIONS_API_PATH}/departments`,
    { signal },
  );

  return response.data;
}

async function getDistricts(
  departmentId: number,
  signal?: AbortSignal,
): Promise<District[]> {
  const response = await apiRequest<DistrictsResponse>(
    `${LOCATIONS_API_PATH}/departments/${encodeURIComponent(String(departmentId))}/districts`,
    { signal },
  );

  return response.data;
}

export const locationsService = {
  getDepartments,
  getDistricts,
};
