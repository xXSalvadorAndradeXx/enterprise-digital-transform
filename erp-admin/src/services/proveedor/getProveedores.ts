import type {
  BackendSupplier,
  BackendSuppliersResponse,
  PaginationMeta,
  ProveedoresResponse,
} from "@/types/proveedor/proveedor.types";

import { isRecord, requestProveedores } from "./proveedor-api";
import { unwrapApiSuccess } from "@/lib/api-response";

export interface GetProveedoresParams {
  search: string;
  page: number;
  limit: number;
}

export async function getProveedores({
  search,
  page,
  limit,
}: GetProveedoresParams): Promise<ProveedoresResponse> {
  const query = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit),
  });

  const { body: rawBody } = await requestProveedores(
    `/api/proveedores?${query.toString()}`,
    { method: "GET" },
  );
  const body = unwrapApiSuccess<unknown>(rawBody);

  if (!isBackendSuppliersResponse(body)) {
    throw new Error(
      "La respuesta de proveedores no tiene el formato esperado.",
    );
  }

  return {
    data: body.data.map((supplier) => ({
      id: supplier.id,
      provider: supplier.name,
      phone: supplier.phone ?? "",
    })),
    pagination: body.meta,
  };
}

function isBackendSupplier(value: unknown): value is BackendSupplier {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isRecord(value) &&
    typeof value.total === "number" &&
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    typeof value.totalPages === "number"
  );
}

function isBackendSuppliersResponse(
  value: unknown,
): value is BackendSuppliersResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isBackendSupplier) &&
    isPaginationMeta(value.meta)
  );
}
