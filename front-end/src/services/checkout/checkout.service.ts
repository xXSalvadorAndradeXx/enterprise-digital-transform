import type {
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
} from "@/types/checkout/checkout.types";

const API_BASE_URL = "/api/v1/ecommerce";

export async function previewCheckout(
  data: CheckoutPreviewRequest,
): Promise<CheckoutPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/checkout/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la vista previa del checkout");
  }

  return response.json();
}