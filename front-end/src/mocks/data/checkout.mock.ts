import type {
  CheckoutPreviewData,
} from "@/types/checkout/checkout.types";

/*
 * Preview para flujo desde carrito.
 */
export const cartCheckoutPreviewMock: CheckoutPreviewData = {
  subtotal: "60.00",
  discountTotal: "6.00",
  shippingTotal: "0.00",
  total: "54.00",
  freeShippingApplied: true,
};

/*
 * Preview para flujo BUY_NOW.
 */
export const buyNowCheckoutPreviewMock: CheckoutPreviewData = {
  subtotal: "97.32",
  discountTotal: "0.00",
  shippingTotal: "4.99",
  total: "102.31",
  freeShippingApplied: false,
};

/*
 * Valores recalculados que pueden devolverse
 * cuando Backend detecta PRICE_CHANGED.
 */
export const priceChangedPreviewMock: CheckoutPreviewData = {
  subtotal: "114.50",
  discountTotal: "17.18",
  shippingTotal: "0.00",
  total: "97.32",
  freeShippingApplied: true,
};

/*
 * Información de stock utilizada para simular
 * STOCK_INSUFFICIENT.
 */
export const stockInsufficientDetailsMock = {
  variantId: "variant-001",
  availableStock: 1,
  requestedQuantity: 2,
};