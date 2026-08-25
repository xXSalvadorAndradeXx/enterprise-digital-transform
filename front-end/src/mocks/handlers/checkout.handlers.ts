import { http, HttpResponse } from "msw";

const API_BASE_URL = "/api/v1/ecommerce";

const isValidIdempotencyKey = (
  value: string | null,
): boolean => {
  if (!value) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
};

export const checkoutHandlers = [
  /*
   * POST /checkout/preview
   */
  http.post(
    `${API_BASE_URL}/checkout/preview`,
    async ({ request }) => {
      let deliveryType:
        | "HOME_DELIVERY"
        | "STORE_PICKUP" = "HOME_DELIVERY";

      try {
        const body = (await request.json()) as {
          deliveryType?: "HOME_DELIVERY" | "STORE_PICKUP";
        };

        if (
          body.deliveryType === "STORE_PICKUP"
        ) {
          deliveryType = "STORE_PICKUP";
        }
      } catch {
        // Si el body no puede leerse,
        // usamos HOME_DELIVERY por defecto.
      }

      const subtotal = 40;
      const discountTotal = 6;

      const shippingTotal =
        deliveryType === "STORE_PICKUP"
          ? 0
          : subtotal >= 50
            ? 0
            : 5;

      const freeShippingApplied =
        deliveryType === "HOME_DELIVERY" &&
        subtotal >= 50;

      const total =
        subtotal -
        discountTotal +
        shippingTotal;

      return HttpResponse.json(
        {
          subtotal: subtotal.toFixed(2),
          discountTotal:
            discountTotal.toFixed(2),
          shippingTotal:
            shippingTotal.toFixed(2),
          total: total.toFixed(2),
          freeShippingApplied,
        },
        {
          status: 200,
        },
      );
    },
  ),

  /*
   * POST /checkout
   */
  http.post(
    `${API_BASE_URL}/checkout`,
    async ({ request }) => {
      const idempotencyKey =
        request.headers.get("Idempotency-Key");

      const mockError =
        request.headers.get("X-Mock-Error");

      const errors: Record<
        string,
        {
          status: 400 | 409;
          detail: string;
        }
      > = {
        INVALID_DELIVERY: {
          status: 400,
          detail:
            "Los datos de entrega no son válidos.",
        },

        INVALID_PAYMENT_COMBINATION: {
          status: 400,
          detail:
            "La combinación de método de pago y entrega no es válida.",
        },

        INVALID_CHECKOUT_SOURCE: {
          status: 400,
          detail:
            "La fuente del checkout no es válida.",
        },

        STOCK_INSUFFICIENT: {
          status: 409,
          detail:
            "No hay stock suficiente para completar el checkout.",
        },

        PRICE_CHANGED: {
          status: 409,
          detail:
            "El precio de uno o más productos ha cambiado.",
        },

        CHECKOUT_ALREADY_PROCESSING: {
          status: 409,
          detail:
            "Ya existe un checkout en proceso.",
        },

        IDEMPOTENCY_KEY_REUSED: {
          status: 409,
          detail:
            "La Idempotency-Key ya fue utilizada.",
        },
      };

      if (
        mockError &&
        errors[mockError]
      ) {
        const error = errors[mockError];

        return HttpResponse.json(
          {
            type:
              "https://example.com/problems/checkout",
            title: "Checkout error",
            status: error.status,
            detail: error.detail,
            code: mockError,
          },
          {
            status: error.status,
          },
        );
      }

      if (
        !isValidIdempotencyKey(
          idempotencyKey,
        )
      ) {
        return HttpResponse.json(
          {
            type:
              "https://example.com/problems/invalid-request",
            title: "Solicitud inválida",
            status: 400,
            detail:
              "Idempotency-Key es obligatorio y debe ser un UUID válido.",
            code: "INVALID_REQUEST",
          },
          {
            status: 400,
          },
        );
      }

      return HttpResponse.json(
        {
          orderNumber: "ARP33451",
          status: "PENDING",
          paymentMethod: "PAY_AT_STORE",
          paymentStatus: "PENDING",
          paymentDeadline:
            "2026-08-25T20:15:00.000Z",
          subtotal: "50.00",
          discountTotal: "5.00",
          shippingTotal: "0.00",
          total: "45.00",
          guestOrderAccessToken: null,
        },
        {
          status: 201,
        },
      );
    },
  ),
];