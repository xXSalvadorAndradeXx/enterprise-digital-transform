import type {
  PurchasesPaginationMetadata,
  PurchasesQuery,
  PurchasesTransportResult,
} from "../types/purchases.types";

export interface PurchasesRequestOptions {
  path: string;
  method: "GET";
  signal?: AbortSignal;
}

export type PurchasesRequestAdapter = (
  options: PurchasesRequestOptions,
) => Promise<unknown>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePositiveInteger(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeMetadata(
  total: number,
  page: number,
  limit: number,
  totalPages?: number,
): PurchasesPaginationMetadata {
  const normalizedTotal = normalizeNonNegativeInteger(total);
  const normalizedPage = normalizePositiveInteger(page);
  const normalizedLimit = normalizePositiveInteger(limit);
  const normalizedTotalPages =
    totalPages === undefined
      ? Math.ceil(normalizedTotal / normalizedLimit)
      : normalizeNonNegativeInteger(totalPages);

  return {
    total: normalizedTotal,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages: normalizedTotalPages,
  };
}

function normalizePurchasesResponse(response: unknown): PurchasesTransportResult {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new Error("La respuesta de compras no contiene un arreglo data válido.");
  }

  if (isRecord(response.meta)) {
    const { total, page, limit, totalPages } = response.meta;

    if (
      isFiniteNumber(total) &&
      isFiniteNumber(page) &&
      isFiniteNumber(limit) &&
      isFiniteNumber(totalPages)
    ) {
      return {
        data: response.data,
        metadata: normalizeMetadata(total, page, limit, totalPages),
      };
    }
  }

  const { total, page, limit } = response;

  if (isFiniteNumber(total) && isFiniteNumber(page) && isFiniteNumber(limit)) {
    return {
      data: response.data,
      metadata: normalizeMetadata(total, page, limit),
    };
  }

  throw new Error("La respuesta paginada de compras tiene una estructura no reconocida.");
}

export async function getCompras(
  query: PurchasesQuery,
  request: PurchasesRequestAdapter,
  signal?: AbortSignal,
): Promise<PurchasesTransportResult> {
  const page = normalizePositiveInteger(query.page);
  const limit = normalizePositiveInteger(query.limit);
  const search = query.search?.trim();
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await request({
    path: `/purchases?${params.toString()}`,
    method: "GET",
    signal,
  });

  // Compatibilidad provisional hasta validar el contrato operativo en Swagger.
  return normalizePurchasesResponse(response);
}
