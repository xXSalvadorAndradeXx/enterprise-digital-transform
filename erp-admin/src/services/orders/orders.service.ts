import { unwrapApiSuccess } from "@/lib/api-response";
import type { AdminOrderDetail, AdminOrdersResponse, OrderStatus } from "@/types/orders";

async function readJson(response: Response): Promise<unknown> {
  const body = await response.json();
  if (!response.ok) {
    const record = body as { message?: string };
    throw new Error(record.message || "No se pudo completar la solicitud.");
  }
  return body;
}

export async function listOrders(params: URLSearchParams): Promise<AdminOrdersResponse> {
  const response = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
  return unwrapApiSuccess<AdminOrdersResponse>(await readJson(response));
}

export async function getOrder(orderNumber: string): Promise<AdminOrderDetail> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, { cache: "no-store" });
  return unwrapApiSuccess<AdminOrderDetail>(await readJson(response));
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await readJson(response);
}
