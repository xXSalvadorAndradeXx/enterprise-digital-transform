export type CheckoutSource = "CART" | "BUY_NOW";

export type DeliveryType = "HOME_DELIVERY" | "STORE_PICKUP";

export type PaymentMethod = "CARD" | "PAY_AT_STORE";

export type CustomerType = "REGISTERED" | "GUEST";

export type OrderStatus =
  | "NEW"
  | "PENDING"
  | "ON_ROUTE"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface CheckoutItem {
  variantId: string;
  quantity: number;
  priceAtAdded?: string;
}

export interface HomeDelivery {
  departmentId: string;
  districtId: string;
  city: string;
  addressLine: string;
}

export interface StorePickup {
  branchId: string;
}

export interface CheckoutContact {
  fullName: string;
  email: string;
  dui: string;
  phone: string;
}

export interface CheckoutCard {
  number: string;
  holderName: string;
  expiration: string;
  cvv: string;
  brand?: "VISA" | "MASTERCARD" | null;
}

export interface CheckoutPreviewRequest {
  source: CheckoutSource;
  items?: CheckoutItem[];
  contact: CheckoutContact;
  deliveryType: DeliveryType;
  delivery: HomeDelivery | StorePickup;
  paymentMethod: PaymentMethod;
}

export interface CheckoutPreviewResponse {
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  total: string;
  freeShippingApplied: boolean;
}

export interface CheckoutCartRequest {
  source: "CART";
  customerType: CustomerType;
  contact: CheckoutContact;
  deliveryType: DeliveryType;
  delivery: HomeDelivery | StorePickup;
  paymentMethod: PaymentMethod;
  saveAddress: boolean;
  card?: CheckoutCard;
}

export interface CheckoutBuyNowRequest {
  source: "BUY_NOW";
  items: CheckoutItem[];
  customerType: CustomerType;
  contact: CheckoutContact;
  deliveryType: DeliveryType;
  delivery: HomeDelivery | StorePickup;
  paymentMethod: PaymentMethod;
  saveAddress: boolean;
  card?: CheckoutCard;
}

export type CheckoutRequest =
  | CheckoutCartRequest
  | CheckoutBuyNowRequest;

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDeadline: string | null;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  total: string;
  guestOrderAccessToken: string | null;
}

// Alias utilizado por la vista previa existente del carrito.
export type CheckoutPreviewData = CheckoutPreviewResponse;
export type HomeDeliveryData = HomeDelivery;
export type StorePickupData = StorePickup;
export type CheckoutDelivery = HomeDelivery | StorePickup;

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

export interface CheckoutPreviewApiResponse {
  success: true;
  message: string;
  data: CheckoutPreviewData;
  timestamp: string;
}
