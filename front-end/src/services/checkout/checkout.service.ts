import type {
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CheckoutRequest,
  Order,
} from "@/types/checkout/checkout.types";

const API_BASE_URL = "/api/v1/ecommerce";

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
    throw new Error(
      "No se pudo obtener la vista previa del checkout",
    );
  }

  return response.json();
}

/**
 * Crea la orden final.
 *
 * La Idempotency-Key se genera una sola vez por intento
 * y debe reutilizarse si el usuario vuelve a enviar
 * exactamente el mismo formulario.
 */
export async function createCheckout(
  data: CheckoutRequest,
  idempotencyKey: string,
): Promise<Order> {
  const response = await fetch(
    `${API_BASE_URL}/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail ??
        "No se pudo completar el checkout",
    );
  }

  return response.json();
}