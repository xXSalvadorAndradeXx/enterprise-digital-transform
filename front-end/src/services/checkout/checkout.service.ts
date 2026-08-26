import type {
  CheckoutPreviewData,
  CheckoutPreviewApiResponse,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CheckoutRequest,
  Order,
} from "@/types/checkout/checkout.types";
import { apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import { readCartToken } from "@/lib/cart-token";

const API_BASE_URL = "/api/v1/ecommerce";

function getCheckoutHeaders(): Record<string, string> {
  const accessToken = readAccessToken();
  if (accessToken) return { Authorization: `Bearer ${accessToken}` };

  const cartToken = readCartToken();
  return cartToken ? { "X-Cart-Token": cartToken } : {};
}

export async function getCheckoutPreview(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewData> {
  const response = await apiRequest<
    CheckoutPreviewApiResponse,
    CheckoutPreviewRequest
  >("/ecommerce/checkout/preview", {
    method: "POST",
    headers: getCheckoutHeaders(),
    body: data,
  });

  return response.data;
}

export class CheckoutError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
    this.code = code;
  }
}

export async function previewCheckout(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewResponse> {
  const response = await fetch(
    `${API_BASE_URL}/checkout/preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("CHECKOUT PREVIEW ERROR", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    throw new CheckoutError(
      `No se pudo obtener la vista previa del checkout (${response.status})`,
      response.status,
    );
  }

  return response.json();
}

export async function createCheckout(
  data: CheckoutRequest,
  idempotencyKey: string,
  mockError?: string,
): Promise<Order> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
  };

  /*
   * Solo para pruebas con MSW.
   * Se elimina después de validar la TASK 907.
   */
  if (mockError) {
    headers["X-Mock-Error"] = mockError;
  }

  const response = await fetch(
    `${API_BASE_URL}/checkout`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new CheckoutError(
      errorBody?.detail ??
        "No se pudo completar el checkout",
      response.status,
      errorBody?.code,
    );
  }

  return response.json();
}
