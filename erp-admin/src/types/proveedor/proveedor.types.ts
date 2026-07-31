export interface Proveedor {
  id: string;
  provider: string;
  phone: string;
}

export interface BackendSupplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackendSuppliersResponse {
  data: BackendSupplier[];
  meta: PaginationMeta;
}

export interface ProveedoresResponse {
  data: Proveedor[];
  pagination: PaginationMeta;
}

export interface ProveedorMutationResponse {
  status: number;
  data: unknown;
}

export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class ProveedorServiceError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(
    message: string,
    status: number,
    payload: ApiErrorPayload | null = null,
  ) {
    super(message);
    this.name = "ProveedorServiceError";
    this.status = status;
    this.payload = payload;
  }
}
