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
}

export interface CheckoutPreviewRequest {
  source: CheckoutSource;
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