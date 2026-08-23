import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type { ApiCart, CartResponse } from "@/types/cart/cart.types";

export type AddCartItemRequest = {
  productId: string | number;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity: number;
};

function getAuthHeaders() {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError("Debes iniciar sesion para usar el carrito.", 401, null);
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getCurrentCart() {
  const response = await apiRequest<CartResponse>("/cart", {
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function addCartItem(data: AddCartItemRequest) {
  const response = await apiRequest<CartResponse, AddCartItemRequest>(
    "/cart/items",
    {
      method: "POST",
      body: data,
      headers: getAuthHeaders(),
    },
  );

  return response.data;
}

export async function updateCartItemQuantity(
  itemId: number,
  data: UpdateCartItemRequest,
) {
  const response = await apiRequest<CartResponse, UpdateCartItemRequest>(
    `/cart/items/${itemId}`,
    {
      method: "PATCH",
      body: data,
      headers: getAuthHeaders(),
    },
  );

  return response.data;
}

export async function removeCartItem(itemId: number) {
  const response = await apiRequest<CartResponse>(`/cart/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function clearCurrentCart() {
  const response = await apiRequest<CartResponse>("/cart", {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return response.data;
}

export type { ApiCart };
