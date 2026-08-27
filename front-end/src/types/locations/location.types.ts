import type { ApiSuccess } from "@/types/api/api.types";

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  departmentId: number;
  name: string;
  code: string;
}

export type DepartmentsResponse = ApiSuccess<Department[]>;
export type DistrictsResponse = ApiSuccess<District[]>;
