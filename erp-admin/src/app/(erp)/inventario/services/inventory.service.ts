import { apiRequest } from "../lib/api";
import { buildQuery } from "../utils/query";
import { INVENTORY_ENDPOINTS } from "../constants/endpoints";

import type {
  InventoryResponseDto,
  InventoryQueryDto,
  InventoryWithDetailsDto,
  InventoryDetailDto,
  PaginatedResponseDto,
  ApiItemResponseDto,
} from "../types";

export async function getInventory(
  query: InventoryQueryDto,
  token?: string
): Promise<PaginatedResponseDto<InventoryResponseDto>> {
  const params = buildQuery(query);

  return apiRequest<PaginatedResponseDto<InventoryResponseDto>>(
    `${INVENTORY_ENDPOINTS.LIST}${params}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function getInventoryById(
  id: string,
  token?: string
): Promise<ApiItemResponseDto<InventoryWithDetailsDto>> {
  return apiRequest<ApiItemResponseDto<InventoryWithDetailsDto>>(
    INVENTORY_ENDPOINTS.DETAIL(id),
    {
      method: "GET",
      token,
    }
  );
}

export async function getInventoryVariants(
  id: string,
  token?: string
): Promise<ApiItemResponseDto<readonly InventoryDetailDto[]>> {
  return apiRequest<ApiItemResponseDto<readonly InventoryDetailDto[]>>(
    INVENTORY_ENDPOINTS.DETAILS(id),
    {
      method: "GET",
      token,
    }
  );
}