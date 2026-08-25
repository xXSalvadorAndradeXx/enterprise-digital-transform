import {
  ApiRequestError,
  apiRequestWithResponse,
} from "@/lib/api-client";

import { readAccessToken } from "@/lib/auth-session";

import {
  clearCartToken,
  readCartToken,
  saveCartToken,
} from "@/lib/cart-token";

import type {
  ApiCart,
  CartResponse,
  AddCartItemRequest,
  UpdateCartItemQuantityRequest,
} from "@/types/cart/cart.types";

const CART_TOKEN_HEADER = "X-Cart-Token";

/*
 * Obtiene los headers correspondientes al carrito actual.
 *
 * Prioridad:
 * 1. Sesión autenticada -> Bearer JWT
 * 2. Invitado -> X-Cart-Token
 */
function getCartHeaders(): Record<string, string> {
  const accessToken = readAccessToken();

  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const cartToken = readCartToken();

  if (cartToken) {
    return {
      [CART_TOKEN_HEADER]: cartToken,
    };
  }

  return {};
}

/*
 * Algunas operaciones requieren que exista un carrito
 * previamente identificado.
 *
 * GET, PATCH y DELETE no deben ejecutarse si no existe
 * JWT ni X-Cart-Token.
 */
function getRequiredCartHeaders(): Record<string, string> {
  const headers = getCartHeaders();

  if (Object.keys(headers).length === 0) {
    throw new ApiRequestError(
      "No existe un carrito activo.",
      401,
      null,
    );
  }

  return headers;
}

/*
 * Guarda únicamente el X-Cart-Token de un carrito invitado.
 *
 * No se guarda si ya existe una sesión autenticada.
 * El token tampoco se escribe en logs.
 */
function persistGuestCartToken(
  response: Response,
): void {
  if (readAccessToken()) {
    return;
  }

  const cartToken = response.headers.get(
    CART_TOKEN_HEADER,
  );

  if (!cartToken) {
    return;
  }

  saveCartToken(cartToken);
}

/*
 * Obtiene el carrito actual.
 *
 * Requiere:
 * - JWT, o
 * - X-Cart-Token.
 */
export async function getCurrentCart(): Promise<ApiCart> {
  const result =
    await apiRequestWithResponse<CartResponse>(
      "/cart",
      {
        headers: getRequiredCartHeaders(),
      },
    );

  persistGuestCartToken(
    result.response,
  );

  return result.data.data;
}

/*
 * Agrega una variante.
 *
 * Esta operación permite:
 *
 * - Usuario autenticado -> JWT
 * - Invitado existente -> X-Cart-Token
 * - Invitado nuevo -> sin credenciales
 *
 * En el último caso Backend crea el carrito y devuelve
 * X-Cart-Token en la respuesta.
 */
export async function addCartItem(
  data: AddCartItemRequest,
): Promise<ApiCart> {
  const result =
    await apiRequestWithResponse<
      CartResponse,
      AddCartItemRequest
    >(
      "/cart/items",
      {
        method: "POST",
        body: data,
        headers: getCartHeaders(),
      },
    );

  persistGuestCartToken(
    result.response,
  );

  return result.data.data;
}

/*
 * Actualiza la cantidad de una línea existente.
 */
export async function updateCartItemQuantity(
  itemId: string,
  data: UpdateCartItemQuantityRequest,
): Promise<ApiCart> {
  const result =
    await apiRequestWithResponse<
      CartResponse,
      UpdateCartItemQuantityRequest
    >(
      `/cart/items/${itemId}`,
      {
        method: "PATCH",
        body: data,
        headers:
          getRequiredCartHeaders(),
      },
    );

  persistGuestCartToken(
    result.response,
  );

  return result.data.data;
}

/*
 * Elimina una línea específica del carrito.
 */
export async function removeCartItem(
  itemId: string,
): Promise<ApiCart> {
  const result =
    await apiRequestWithResponse<CartResponse>(
      `/cart/items/${itemId}`,
      {
        method: "DELETE",
        headers:
          getRequiredCartHeaders(),
      },
    );

  persistGuestCartToken(
    result.response,
  );

  return result.data.data;
}

/*
 * Vacía todas las líneas del carrito actual después de
 * completar correctamente una orden.
 */
export async function clearCurrentCart(): Promise<ApiCart> {
  const result =
    await apiRequestWithResponse<CartResponse>(
      "/cart",
      {
        method: "DELETE",
        headers: getRequiredCartHeaders(),
      },
    );

  persistGuestCartToken(result.response);

  return result.data.data;
}

/*
 * Combina el carrito invitado con la sesión autenticada.
 *
 * Requiere simultáneamente:
 * - Authorization Bearer
 * - X-Cart-Token
 */
export async function mergeGuestCart(): Promise<ApiCart> {
  const accessToken = readAccessToken();
  const cartToken = readCartToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Se requiere una sesión para combinar el carrito.",
      401,
      null,
    );
  }

  if (!cartToken) {
    throw new ApiRequestError(
      "No existe un carrito invitado para combinar.",
      400,
      null,
    );
  }

  const result =
    await apiRequestWithResponse<CartResponse>(
      "/cart/merge",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          [CART_TOKEN_HEADER]: cartToken,
        },
      },
    );

  /*
   * Solo se elimina después de que el merge
   * terminó correctamente.
   */
  clearCartToken();

  return result.data.data;
}

export type { ApiCart };
