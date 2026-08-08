import { apiRequest } from "../lib/api";
import { buildQuery } from "../utils/query";
import { MOVEMENT_ENDPOINTS } from "../constants/endpoints";

import type {
  MovementResponseDto,
  MovementQueryDto,
  CreateAdjustmentDto,
  PaginatedResponseDto,
  ApiItemResponseDto,
} from "../types";

export async function getMovements(
  query: MovementQueryDto,
  token?: string
): Promise<PaginatedResponseDto<MovementResponseDto>> {
  const params = buildQuery(query);

  return apiRequest<PaginatedResponseDto<MovementResponseDto>>(
    `${MOVEMENT_ENDPOINTS.LIST}${params}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function getMovementById(
  id: string,
  token?: string
): Promise<ApiItemResponseDto<MovementResponseDto>> {
  return apiRequest<ApiItemResponseDto<MovementResponseDto>>(
    MOVEMENT_ENDPOINTS.DETAIL(id),
    {
      method: "GET",
      token,
    }
  );
}

export async function createAdjustment(
  data: CreateAdjustmentDto,
  token?: string
): Promise<ApiItemResponseDto<MovementResponseDto>> {
  return apiRequest<ApiItemResponseDto<MovementResponseDto>>(
    MOVEMENT_ENDPOINTS.ADJUSTMENTS,
    {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }
  );
}