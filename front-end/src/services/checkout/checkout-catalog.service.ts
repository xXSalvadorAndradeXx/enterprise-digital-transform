import { apiRequest } from "@/lib/api-client";

export interface CheckoutCatalogOption {
  id: string;
  name: string;
  code?: string;
}

type ApiListResponse = CheckoutCatalogOption[] | { data: CheckoutCatalogOption[] };

function unwrapList(response: ApiListResponse): CheckoutCatalogOption[] {
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
  return unwrapList(await apiRequest<ApiListResponse>("/branches?allowsPickup=true"));
}
