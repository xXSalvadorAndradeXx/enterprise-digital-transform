import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type {
  OrderListItem,
  OrdersPaginationMeta,
  OrdersQuery,
  OrdersResponse,
} from "@/types/orders/order.types";

type BackendOrderListItem = Omit<OrderListItem, "total"> & {
  total: number | string;
};

type BackendOrdersResponse = {
  success: boolean;
  data: {
    items: BackendOrderListItem[];
    meta: OrdersPaginationMeta;
  };
};

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
  const response = await apiRequest<BackendOrdersResponse>(
    `/customers/me/orders${buildOrdersQuery(query)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return {
    data: response.data.items.map((order) => ({
      ...order,
      total: Number(order.total),
    })),
    meta: response.data.meta,
  } satisfies OrdersResponse;
}
