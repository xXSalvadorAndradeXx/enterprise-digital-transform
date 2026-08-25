export interface MockDepartmentOption {
  id: string;
  label: string;
}

export interface MockDistrictOption {
  id: string;
  departmentId: string;
  label: string;
}

export const mockDepartments = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    label: "Usulután",
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    label: "San Salvador",
  },
] as const satisfies readonly MockDepartmentOption[];

export const mockDistricts = [
  {
    id: "c1111111-1111-4111-8111-111111111111",
    departmentId: "a1111111-1111-4111-8111-111111111111",
    label: "Jucuarán",
  },
  {
    id: "c2222222-2222-4222-8222-222222222222",
    departmentId: "a1111111-1111-4111-8111-111111111111",
    label: "Santiago de María",
  },
  {
    id: "d1111111-1111-4111-8111-111111111111",
    departmentId: "b2222222-2222-4222-8222-222222222222",
    label: "San Salvador",
  },
  {
    id: "d2222222-2222-4222-8222-222222222222",
    departmentId: "b2222222-2222-4222-8222-222222222222",
    label: "Soyapango",
  },
] as const satisfies readonly MockDistrictOption[];
