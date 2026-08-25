import {
  ApiRequestError,
  apiRequest,
} from "@/lib/api-client";

import { readAccessToken } from "@/lib/auth-session";

import type {
  ApiCart,
  CartResponse,
  AddCartItemRequest,
  UpdateCartItemQuantityRequest,
} from "@/types/cart/cart.types";

function getAuthHeaders() {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Debes iniciar sesion para usar el carrito.",
      401,
      null,
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getCurrentCart(): Promise<ApiCart> {
  const response = await apiRequest<CartResponse>(
    "/cart",
    {
      headers: getAuthHeaders(),
    },
  );

  return response.data;
}

export async function addCartItem(
  data: AddCartItemRequest,
): Promise<ApiCart> {
  const response = await apiRequest<
    CartResponse,
    AddCartItemRequest
  >("/cart/items", {
    method: "POST",
    body: data,
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function updateCartItemQuantity(
  itemId: string,
  data: UpdateCartItemQuantityRequest,
): Promise<ApiCart> {
  const response = await apiRequest<
    CartResponse,
    UpdateCartItemQuantityRequest
  >(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: data,
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function removeCartItem(
  itemId: string,
): Promise<ApiCart> {
  const response = await apiRequest<CartResponse>(
    `/cart/items/${itemId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  return response.data;
}


export type { ApiCart };