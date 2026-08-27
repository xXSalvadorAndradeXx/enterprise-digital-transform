import type {
  Department,
  District,
} from "@/types/locations/location.types";

export const mockDepartments = [
  {
    id: 1,
    name: "Usulután",
    code: "USU",
  },
  {
    id: 2,
    name: "San Salvador",
    code: "SS",
  },
] as const satisfies readonly Department[];

export const mockDistricts = [
  {
    id: 101,
    departmentId: 1,
    name: "Jucuarán",
    code: "JUC",
  },
  {
    id: 102,
    departmentId: 1,
    name: "Santiago de María",
    code: "SDM",
  },
  {
    id: 201,
    departmentId: 2,
    name: "San Salvador",
    code: "SS-C",
  },
  {
    id: 202,
    departmentId: 2,
    name: "Soyapango",
    code: "SOY",
  },
] as const satisfies readonly District[];
