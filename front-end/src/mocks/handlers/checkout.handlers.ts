import {
  http,
  HttpResponse,
} from "msw";

import type {
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
} from "@/types/checkout/checkout.types";

import {
  buyNowCheckoutPreviewMock,
  cartCheckoutPreviewMock,
  priceChangedPreviewMock,
  stockInsufficientDetailsMock,
} from "@/mocks/data/checkout.mock";

const API_BASE_URL =
  "http://localhost:3000";

type CheckoutScenario =
  | "SUCCESS"
  | "INVALID_DELIVERY"
  | "INVALID_PAYMENT_COMBINATION"
  | "PRICE_CHANGED"
  | "STOCK_INSUFFICIENT"
  | "UNAUTHORIZED"
  | "SERVER_ERROR";

let currentCheckoutScenario: CheckoutScenario =
  "SUCCESS";

function createPreviewResponse(
  data: CheckoutPreviewResponse["data"],
): CheckoutPreviewResponse {
  return {
    success: true,
    message:
      "Checkout preview calculated successfully",
    data,
    timestamp:
      new Date().toISOString(),
  };
}

function createApiError(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return {
    success: false,
    statusCode,
    code,
    message,

    error:
      statusCode >= 500
        ? "Internal Server Error"
        : statusCode === 401
          ? "Unauthorized"
          : statusCode === 409
            ? "Conflict"
            : "Bad Request",

    details,

    timestamp:
      new Date().toISOString(),

    path:
      "/checkout/preview",
  };
}

/*
 * Permite cambiar temporalmente
 * el escenario desde pruebas.
 */
export function setCheckoutMockScenario(
  scenario: CheckoutScenario,
) {
  currentCheckoutScenario =
    scenario;
}

/*
 * Restaura escenario exitoso.
 */
export function resetCheckoutMockScenario() {
  currentCheckoutScenario =
    "SUCCESS";
}

const checkoutPreviewHandler =
  http.post(
    `${API_BASE_URL}/checkout/preview`,

    async ({
      request,
    }) => {
      if (
        currentCheckoutScenario ===
        "UNAUTHORIZED"
      ) {
        return HttpResponse.json(
          createApiError(
            401,
            "SESSION_EXPIRED_OR_REVOKED",
            "La sesión no es válida o ha expirado.",
          ),
          {
            status: 401,
          },
        );
      }

      if (
        currentCheckoutScenario ===
        "SERVER_ERROR"
      ) {
        return HttpResponse.json(
          createApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "No se pudo calcular la vista previa del pedido.",
          ),
          {
            status: 500,
          },
        );
      }

      if (
        currentCheckoutScenario ===
        "INVALID_DELIVERY"
      ) {
        return HttpResponse.json(
          createApiError(
            400,
            "INVALID_DELIVERY",
            "La información de entrega no es válida.",
          ),
          {
            status: 400,
          },
        );
      }

      if (
        currentCheckoutScenario ===
        "INVALID_PAYMENT_COMBINATION"
      ) {
        return HttpResponse.json(
          createApiError(
            400,
            "INVALID_PAYMENT_COMBINATION",
            "El método de pago no es compatible con el tipo de entrega.",
          ),
          {
            status: 400,
          },
        );
      }

      if (
        currentCheckoutScenario ===
        "PRICE_CHANGED"
      ) {
        return HttpResponse.json(
          createApiError(
            409,
            "PRICE_CHANGED",
            "El precio o descuento cambió.",
            {
              recalculated:
                priceChangedPreviewMock,
            },
          ),
          {
            status: 409,
          },
        );
      }

      if (
        currentCheckoutScenario ===
        "STOCK_INSUFFICIENT"
      ) {
        return HttpResponse.json(
          createApiError(
            409,
            "STOCK_INSUFFICIENT",
            "El stock cambió antes de confirmar.",
            stockInsufficientDetailsMock,
          ),
          {
            status: 409,
          },
        );
      }

      const body =
        await request.json() as
          CheckoutPreviewRequest;

      if (
        body.source === "BUY_NOW"
      ) {
        return HttpResponse.json(
          createPreviewResponse(
            buyNowCheckoutPreviewMock,
          ),
          {
            status: 200,
          },
        );
      }

      return HttpResponse.json(
        createPreviewResponse(
          cartCheckoutPreviewMock,
        ),
        {
          status: 200,
        },
      );
    },
  );

export const checkoutHandlers = [
  checkoutPreviewHandler,
];