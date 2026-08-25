export type CheckoutSource =
  | "CART"
  | "BUY_NOW";

export type DeliveryType =
  | "HOME_DELIVERY"
  | "STORE_PICKUP";

export type PaymentMethod =
  | "CARD"
  | "PAY_AT_STORE";

export interface HomeDeliveryData {
  departmentId: string;
  districtId: string;
  city: string;
  addressLine: string;
}

export interface StorePickupData {
  branchId: string;
}

export type CheckoutDelivery =
  | HomeDeliveryData
  | StorePickupData;

export interface CheckoutPreviewRequest {
  source: CheckoutSource;
  deliveryType: DeliveryType;
  delivery: CheckoutDelivery;
  paymentMethod: PaymentMethod;
}

export interface CheckoutPreviewData {
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  total: string;
  freeShippingApplied: boolean;
}

export interface CheckoutPreviewResponse {
  success: true;
  message: string;
  data: CheckoutPreviewData;
  timestamp: string;
}

export type CheckoutErrorCode =
  | "INVALID_DELIVERY"
  | "INVALID_PAYMENT_COMBINATION"
  | "INVALID_CHECKOUT_SOURCE"
  | "STOCK_INSUFFICIENT"
  | "PRICE_CHANGED"
  | "CHECKOUT_ALREADY_PROCESSING"
  | "IDEMPOTENCY_KEY_REUSED";

export interface CheckoutErrorResponse {
  success: false;
  statusCode: number;
  code: CheckoutErrorCode | string;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}