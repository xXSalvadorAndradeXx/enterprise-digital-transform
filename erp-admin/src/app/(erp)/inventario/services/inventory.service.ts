import { apiRequest } from "../lib/api";
import { buildQuery } from "../utils/query";
import { INVENTORY_ENDPOINTS } from "../constants/endpoints";
import { unwrapApiSuccess } from "@/lib/api-response";

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

  const response = await apiRequest<unknown>(
    `${INVENTORY_ENDPOINTS.LIST}${params}`,
    {
      method: "GET",
      token,
    }
  );

  return unwrapApiSuccess<PaginatedResponseDto<InventoryResponseDto>>(response);
}

export async function getInventoryById(
  id: string,
  token?: string
): Promise<ApiItemResponseDto<InventoryWithDetailsDto>> {
  const rawResponse = await apiRequest<
    InventoryWithDetailsDto | ApiItemResponseDto<InventoryWithDetailsDto>
  >(
    INVENTORY_ENDPOINTS.DETAIL(id),
    {
      method: "GET",
      token,
    }
  );

  // Inventario actualmente devuelve el DTO directamente, mientras otros
  // módulos usan { data, statusCode }. Admitimos ambas formas en el BFF.
  const response = unwrapApiSuccess<
    InventoryWithDetailsDto | ApiItemResponseDto<InventoryWithDetailsDto>
  >(rawResponse);

  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return response;
  }

  return {
    data: response,
    statusCode: 200,
  };
}

export async function getInventoryVariants(
  id: string,
  token?: string
): Promise<readonly InventoryDetailDto[]> {
  const rawResponse = await apiRequest<
    readonly InventoryDetailDto[] | ApiItemResponseDto<readonly InventoryDetailDto[]>
  >(
    INVENTORY_ENDPOINTS.DETAILS(id),
    {
      method: "GET",
      token,
    }
  );

  // Backend actualmente responde el arreglo directamente. Esta normalización
  // también admite el envoltorio { data } definido por el contrato acordado.
  const response = unwrapApiSuccess<
    readonly InventoryDetailDto[] | ApiItemResponseDto<readonly InventoryDetailDto[]>
  >(rawResponse);

  return "data" in response ? response.data : response;
}
