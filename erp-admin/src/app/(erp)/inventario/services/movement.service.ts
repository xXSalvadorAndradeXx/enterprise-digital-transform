import { apiRequest } from "../lib/api";
import { MOVEMENT_ENDPOINTS } from "../constants/endpoints";
import { MovementChannel, MovementDirection } from "../types";
import { unwrapApiSuccess } from "@/lib/api-response";

import type {
  MovementListItem,
  MovementQueryDto,
  PaginatedResponseDto,
  ResponsibleUserRefDto,
} from "../types";

interface BackendMovementDto {
  readonly id: string;
  readonly type?: string;
  readonly direction?: string;
  readonly quantity: number;
  readonly channel?: string | null;
  readonly productName?: string | null;
  readonly inventoryName?: string;
  readonly product?: {
    readonly commercialName?: string | null;
    readonly nombre?: string | null;
  } | null;
  readonly responsibleUser?: ResponsibleUserRefDto | null;
  readonly createdBy?: ResponsibleUserRefDto | null;
  readonly createdAt: string;
}

function normalizeDirection(item: BackendMovementDto): MovementDirection {
  const value = item.direction ?? item.type;

  return String(value).toUpperCase() === MovementDirection.ENTRADA
    ? MovementDirection.ENTRADA
    : MovementDirection.SALIDA;
}

function normalizeChannel(value: string | null | undefined): MovementChannel | null {
  if (value === MovementChannel.ECOMMERCE) {
    return MovementChannel.ECOMMERCE;
  }

  if (value === MovementChannel.TIENDA_FISICA) {
    return MovementChannel.TIENDA_FISICA;
  }

  return null;
}

function toMovementListItem(item: BackendMovementDto): MovementListItem {
  return {
    id: item.id,
    direction: normalizeDirection(item),
    quantity: Number(item.quantity),
    channel: normalizeChannel(item.channel),
    inventoryName:
      item.productName ??
      item.product?.commercialName ??
      item.inventoryName ??
      item.product?.nombre ??
      "—",
    responsibleUser: item.responsibleUser ?? item.createdBy ?? null,
    createdAt: item.createdAt,
  };
}

function matchesLocalFilters(
  item: MovementListItem,
  query: MovementQueryDto,
): boolean {
  if (
    query.search &&
    !item.inventoryName
      .toLocaleLowerCase()
      .includes(query.search.toLocaleLowerCase())
  ) {
    return false;
  }

  if (query.dateFrom && new Date(item.createdAt) < new Date(query.dateFrom)) {
    return false;
  }

  if (query.dateTo && new Date(item.createdAt) >= new Date(query.dateTo)) {
    return false;
  }

  if (query.channel && item.channel !== query.channel) {
    return false;
  }

  return true;
}

export async function getMovements(
  query: MovementQueryDto,
  token?: string,
): Promise<PaginatedResponseDto<MovementListItem>> {
  const requiresLocalFiltering = Boolean(
    query.search || query.dateFrom || query.dateTo || query.channel,
  );
  const requestedPage = query.page ?? 1;
  const requestedLimit = query.limit ?? 20;
  const params = new URLSearchParams({
    page: requiresLocalFiltering ? "1" : String(requestedPage),
    limit: requiresLocalFiltering ? "100" : String(requestedLimit),
  });

  if (query.inventoryId) {
    params.set("productId", query.inventoryId);
  }

  if (query.direction) {
    params.set(
      "type",
      query.direction === MovementDirection.ENTRADA ? "Entrada" : "Salida",
    );
  }

  const rawResponse = await apiRequest<unknown>(
    `${MOVEMENT_ENDPOINTS.LIST}?${params.toString()}`,
    { method: "GET", token },
  );
  const response = unwrapApiSuccess<PaginatedResponseDto<BackendMovementDto>>(
    rawResponse,
  );
  const normalizedItems = response.data.map(toMovementListItem);

  if (!requiresLocalFiltering) {
    return { data: normalizedItems, meta: response.meta };
  }

  const filteredItems = normalizedItems.filter((item) =>
    matchesLocalFilters(item, query),
  );
  const start = (requestedPage - 1) * requestedLimit;

  return {
    data: filteredItems.slice(start, start + requestedLimit),
    meta: {
      total: filteredItems.length,
      page: requestedPage,
      limit: requestedLimit,
      totalPages: Math.ceil(filteredItems.length / requestedLimit),
    },
  };
}
