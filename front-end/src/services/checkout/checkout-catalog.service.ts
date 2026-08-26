import { apiRequest } from "@/lib/api-client";

export interface CheckoutCatalogOption {
  id: string;
  name: string;
  code?: string;
}

export interface CheckoutBranchOption extends CheckoutCatalogOption {
  address: string | null;
  phone: string | null;
  allowsPickup: boolean;
  department: CheckoutCatalogOption | null;
  district: CheckoutCatalogOption | null;
}

type ApiListResponse<T extends CheckoutCatalogOption = CheckoutCatalogOption> =
  | T[]
  | { data: T[] };

function unwrapList<T extends CheckoutCatalogOption>(response: ApiListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.data ?? [];
}

export async function getDepartments() {
  return unwrapList(await apiRequest<ApiListResponse>("/locations/departments"));
}

export async function getDistricts(departmentId: string) {
  return unwrapList(await apiRequest<ApiListResponse>(
    `/locations/departments/${encodeURIComponent(departmentId)}/districts`,
  ));
}

export async function getPickupBranches() {
  return unwrapList(
    await apiRequest<ApiListResponse<CheckoutBranchOption>>(
      "/branches?allowsPickup=true",
    ),
  );
}
