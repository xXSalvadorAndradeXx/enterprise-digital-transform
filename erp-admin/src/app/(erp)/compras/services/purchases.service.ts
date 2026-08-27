import type {
  CreateNewProductPurchaseRequest,
  CreateRestockPurchaseRequest,
  InvoiceUploadResponse,
  PurchaseResponse,
  PurchasesPaginationMetadata,
  PurchasesQuery,
  RestockInventoryOption,
  RestockPreviewResponse,
  UpdatePurchaseRequest,
} from "../types/purchases.types";

type ApiEnvelope<T> = { data: T; statusCode?: number };
type PaginatedEnvelope<T> = { data: T[]; meta: PurchasesPaginationMetadata };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Backend puede responder el recurso directamente o dentro de `{ data }`.
 * Esta normalización mantiene el resto del módulo independiente del
 * formato de transporte utilizado por cada endpoint.
 */
function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  let current: unknown = payload;

  // Algunos endpoints históricos retornan `{ statusCode, data }` y el
  // interceptor global vuelve a envolverlos en `{ success, data }`.
  // Se eliminan ambos niveles sin desarmar una respuesta paginada.
  while (
    isRecord(current) &&
    "data" in current &&
    !("meta" in current && Array.isArray(current.data))
  ) {
    current = current.data;
  }

  return current as T;
}

function normalizePaginated<T>(
  payload: PaginatedEnvelope<T> | ApiEnvelope<PaginatedEnvelope<T>>,
): PaginatedEnvelope<T> {
  if (isRecord(payload) && "meta" in payload && Array.isArray(payload.data)) {
    return payload as PaginatedEnvelope<T>;
  }

  return unwrapData(payload);
}

export class PurchasesServiceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PurchasesServiceError";
  }
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

function getMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(" ");
  }
  return "No se pudo completar la operación de compras.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/purchases${path}`, { ...init, cache: "no-store" });
  const body = await readJson(response);
  if (!response.ok) throw new PurchasesServiceError(getMessage(body), response.status);
  return body as T;
}

export async function uploadPurchaseInvoice(file: File): Promise<InvoiceUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await request<
    InvoiceUploadResponse | ApiEnvelope<InvoiceUploadResponse>
  >("/upload-invoice", { method: "POST", body: formData });

  const invoice = unwrapData<InvoiceUploadResponse>(response);

  if (!invoice?.invoiceUrl) {
    throw new PurchasesServiceError(
      "El servidor no devolvió la URL de la factura.",
      502,
    );
  }

  return invoice;
}

export async function createNewProductPurchase(payload: CreateNewProductPurchaseRequest): Promise<PurchaseResponse> {
  const response = await request<PurchaseResponse | ApiEnvelope<PurchaseResponse>>(
    "/new-product",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(response);
}

export async function createRestockPurchase(payload: CreateRestockPurchaseRequest): Promise<PurchaseResponse> {
  const response = await request<PurchaseResponse | ApiEnvelope<PurchaseResponse>>(
    "/replenishment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return unwrapData(response);
}

export async function getPurchases(query: PurchasesQuery, signal?: AbortSignal): Promise<PaginatedEnvelope<PurchaseResponse>> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search?.trim()) params.set("search", query.search.trim());
  const response = await request<
    | PaginatedEnvelope<PurchaseResponse>
    | ApiEnvelope<PaginatedEnvelope<PurchaseResponse>>
  >(`?${params}`, { signal });

  return normalizePaginated(response);
}

export async function getPurchaseById(purchaseId: string): Promise<PurchaseResponse> {
  const response = await request<PurchaseResponse | ApiEnvelope<PurchaseResponse>>(
    `/${encodeURIComponent(purchaseId)}`,
  );

  return unwrapData(response);
}

export async function updatePurchase(
  purchaseId: string,
  payload: UpdatePurchaseRequest,
): Promise<PurchaseResponse> {
  const response = await request<PurchaseResponse | ApiEnvelope<PurchaseResponse>>(
    `/${encodeURIComponent(purchaseId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return unwrapData(response);
}

export async function getRestockInventoryOptions(search = ""): Promise<RestockInventoryOption[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  const response = await request<
    RestockInventoryOption[] | ApiEnvelope<RestockInventoryOption[]>
  >(`/inventory-options?${params}`);

  const options = unwrapData(response);
  return Array.isArray(options) ? options : [];
}

export async function getRestockPreview(inventoryId: string): Promise<RestockPreviewResponse> {
  const response = await request<
    RestockPreviewResponse | ApiEnvelope<RestockPreviewResponse>
  >(`/inventory/${encodeURIComponent(inventoryId)}/preview-restock`);

  return unwrapData(response);
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  await request<null>(`/${encodeURIComponent(purchaseId)}`, { method: "DELETE" });
}
