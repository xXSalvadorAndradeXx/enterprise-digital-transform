import {
  ApiRequestError,
  apiRequest,
} from "@/lib/api-client";

import { readAccessToken } from "@/lib/auth-session";
import { readCartToken } from "@/lib/cart-token";

import type {
  CheckoutPreviewData,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
} from "@/types/checkout/checkout.types";

function getCheckoutHeaders(): Record<string, string> {
  const accessToken = readAccessToken();

  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const cartToken = readCartToken();

  if (cartToken) {
    return {
      "X-Cart-Token": cartToken,
    };
  }

  throw new ApiRequestError(
    "No existe un carrito disponible para realizar la vista previa.",
    401,
    null,
  );
}

export async function getCheckoutPreview(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewData> {
  const response = await apiRequest<
    CheckoutPreviewResponse,
    CheckoutPreviewRequest
  >("/checkout/preview", {
    method: "POST",
    body: data,
    headers: getCheckoutHeaders(),
  });

  return response.data;
}