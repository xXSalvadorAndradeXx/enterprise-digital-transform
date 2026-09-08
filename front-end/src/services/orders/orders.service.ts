import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type {
  OrdersQuery,
  OrdersResponse,
} from "@/types/orders/order.types";

function getAuthHeaders() {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Debes iniciar sesión para consultar tus pedidos.",
      401,
      null,
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildOrdersQuery(query: OrdersQuery = {}) {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.status !== undefined) {
    params.set("status", query.status);
  }

  if (query.sortOrder !== undefined) {
    params.set("sortOrder", query.sortOrder);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getOrders(query: OrdersQuery = {}) {
  const response = await apiRequest<{
    success: boolean;
    data: OrdersResponse;
  }>(
    `/customers/me/orders${buildOrdersQuery(query)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return response.data;
}