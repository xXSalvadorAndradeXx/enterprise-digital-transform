import type {
  CheckoutPreviewData,
  CheckoutPreviewApiResponse,
  CheckoutPreviewRequest,
  CheckoutRequest,
  Order,
} from "@/types/checkout/checkout.types";
import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import { readCartToken } from "@/lib/cart-token";

function getCheckoutHeaders(): Record<string, string> {
  const accessToken = readAccessToken();
  if (accessToken) return { Authorization: `Bearer ${accessToken}` };

  const cartToken = readCartToken();
  return cartToken ? { "X-Cart-Token": cartToken } : {};
}

function mapDelivery(data: CheckoutPreviewRequest | CheckoutRequest) {
  return {
    deliveryType: data.deliveryType,
    ...data.delivery,
  };
}

function getErrorCode(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const record = response as { code?: unknown; error?: unknown };
  if (typeof record.code === "string") return record.code;
  if (record.error && typeof record.error === "object" && "code" in record.error) {
    const code = (record.error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function getCheckoutErrorMessage(error: Error): string {
  const code = error instanceof ApiRequestError
    ? getErrorCode(error.response)
    : error instanceof CheckoutError ? error.code : undefined;
  if (code === "INVALID_PAYMENT_COMBINATION" || error.message === "Combinación de método de pago y tipo de entrega no permitida") {
    return "Para pagar en la tienda, selecciona «Retiro en tienda». Si prefieres entrega a domicilio, elige «Pago con tarjeta».";
  }
  return error.message;
}

export async function getCheckoutPreview(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewData> {
  const response = await apiRequest<
    CheckoutPreviewApiResponse,
    unknown
  >("/ecommerce/checkout/preview", {
    method: "POST",
    headers: getCheckoutHeaders(),
    body: {
      source: data.source,
      ...(data.items ? { items: data.items } : {}),
      contact: data.contact,
      delivery: mapDelivery(data),
      paymentMethod: data.paymentMethod,
    },
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

export async function createCheckout(
  data: CheckoutRequest,
  idempotencyKey: string,
): Promise<Order> {
  const digits = data.card?.number.replace(/\D/g, "") ?? "";
  const payload = {
    source: data.source,
    ...(data.source === "BUY_NOW" ? { items: data.items } : {}),
    contact: data.contact,
    delivery: {
      ...mapDelivery(data),
      ...(data.saveAddress ? { isDefault: true } : {}),
    },
    paymentMethod: data.paymentMethod,
    ...(data.paymentMethod === "CARD"
      ? {
          card: {
            cardLastFour: digits.slice(-4),
            cardBrand: data.card?.brand ?? "UNKNOWN",
            cardToken: `tok_web_${crypto.randomUUID()}`,
            simulateSuccess: true,
          },
        }
      : {}),
  };

  try {
    const response = await apiRequest<{ success: true; data: Order }, unknown>(
      "/orders/checkout",
      {
        method: "POST",
        headers: {
          ...getCheckoutHeaders(),
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      },
    );

    return response.data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new CheckoutError(error.message, error.status, getErrorCode(error.response));
    }
    throw error;
  }
}
