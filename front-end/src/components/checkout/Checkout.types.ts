// Tipos del shell de checkout (Tarea 831 - FR-CHK-02).
// Los nombres de campos siguen el contrato Contrato_API_Frontend_ERP_ECommerce v1.2
// (secciones 4, 9.2 y 9.3) para que no haya que remapear nada cuando se conecte
// el backend real.

export type CheckoutStepId = "contact" | "shipping" | "payment";

export interface ContactData {
  fullName: string;
  email: string;
  dui: string;
  phone: string;
}

export type DeliveryType = "HOME_DELIVERY" | "STORE_PICKUP";

export interface HomeDeliveryData {
  departmentId: string;
  districtId: string;
  city: string;
  addressLine: string;
  saveInfo: boolean;
}

export interface StorePickupData {
  branchId: string;
}

export interface ShippingData {
  deliveryType: DeliveryType;
  homeDelivery: HomeDeliveryData;
  storePickup: StorePickupData;
}

// "PAGADITO" se deja modelado porque aparece en la UI, pero el contrato
// (§9.3) es explícito: es solo visual, nunca se envía en el checkout real.
export type PaymentMethod = "PAGADITO" | "PAY_AT_STORE" | "CARD";

export interface CardData {
  number: string;
  holderName: string;
  expiration: string;
  cvv: string;
}

export interface PaymentData {
  method: PaymentMethod | null;
  card: CardData;
}

export interface CartItemPreview {
  productName: string;
  variantLabel: string;
  imageUrl: string;
  unitPrice: string; // decimal string, igual que el contrato
}

export interface CheckoutTotalsPreview {
  subtotal: string;
  shippingTotal: string | null; // null = aún no calculado por /checkout/preview
  total: string;
}
