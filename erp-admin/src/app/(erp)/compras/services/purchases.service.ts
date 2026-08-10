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
  const response = await request<ApiEnvelope<InvoiceUploadResponse>>("/upload-invoice", { method: "POST", body: formData });
  return response.data;
}

export async function createNewProductPurchase(payload: CreateNewProductPurchaseRequest): Promise<PurchaseResponse> {
  const response = await request<ApiEnvelope<PurchaseResponse>>("/nuevo-producto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return response.data;
}

export async function createRestockPurchase(payload: CreateRestockPurchaseRequest): Promise<PurchaseResponse> {
  const response = await request<ApiEnvelope<PurchaseResponse>>("/reabastecimiento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return response.data;
}

export async function getPurchases(query: PurchasesQuery, signal?: AbortSignal): Promise<PaginatedEnvelope<PurchaseResponse>> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search?.trim()) params.set("search", query.search.trim());
  return request<PaginatedEnvelope<PurchaseResponse>>(`?${params}`, { signal });
}

export async function getPurchaseById(purchaseId: string): Promise<PurchaseResponse> {
  const response = await request<ApiEnvelope<PurchaseResponse>>(`/${encodeURIComponent(purchaseId)}`);
  return response.data;
}

export async function updatePurchase(
  purchaseId: string,
  payload: UpdatePurchaseRequest,
): Promise<PurchaseResponse> {
  const response = await request<ApiEnvelope<PurchaseResponse>>(
    `/${encodeURIComponent(purchaseId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return response.data;
}

export async function getRestockInventoryOptions(search = ""): Promise<RestockInventoryOption[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  const response = await request<ApiEnvelope<RestockInventoryOption[]>>(`/inventory-options?${params}`);
  return response.data;
}

export async function getRestockPreview(inventoryId: string): Promise<RestockPreviewResponse> {
  const response = await request<ApiEnvelope<RestockPreviewResponse>>(`/inventory/${encodeURIComponent(inventoryId)}/preview-restock`);
  return response.data;
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  await request<null>(`/${encodeURIComponent(purchaseId)}`, { method: "DELETE" });
}
