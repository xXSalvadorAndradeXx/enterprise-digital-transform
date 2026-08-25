// Validación de UX por paso. Es únicamente para feedback en el formulario:
// el contrato (§1 y §14) deja claro que el Frontend no es la fuente de
// verdad para reglas comerciales, así que esto nunca decide precio, stock
// ni disponibilidad — solo evita que el usuario avance con campos vacíos
// o con formato inválido.

import type {
  ContactData,
  ShippingData,
  PaymentData,
} from "./Checkout.types";

export type ContactErrors = Partial<Record<keyof ContactData, string>>;

export function validateContact(data: ContactData): ContactErrors {
  const errors: ContactErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Ingresa tu nombre completo";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "Ingresa un correo electrónico válido";
  if (data.dui.trim().length < 9)
    errors.dui = "Ingresa un número de identificación válido";
  if (!/^\d{8}$/.test(data.phone.trim()))
    errors.phone = "Ingresa un número de teléfono válido de 8 dígitos";
  return errors;
}

export interface ShippingErrors {
  branchId?: string;
  departmentId?: string;
  districtId?: string;
  addressLine?: string;
}

export function validateShipping(data: ShippingData): ShippingErrors {
  const errors: ShippingErrors = {};
  if (data.deliveryType === "STORE_PICKUP") {
    if (!data.storePickup.branchId) errors.branchId = "Selecciona una sucursal";
  } else {
    if (!data.homeDelivery.departmentId) errors.departmentId = "Selecciona un departamento";
    if (!data.homeDelivery.districtId) errors.districtId = "Selecciona un distrito";
    if (!data.homeDelivery.addressLine.trim()) errors.addressLine = "Ingresa una dirección";
  }
  return errors;
}

export interface PaymentErrors {
  method?: string;
  number?: string;
  holderName?: string;
  expiration?: string;
  cvv?: string;
}

export function validatePayment(data: PaymentData): PaymentErrors {
  const errors: PaymentErrors = {};
  if (!data.method) {
    errors.method = "Selecciona una forma de pago";
    return errors;
  }
  if (data.method === "CARD") {
    if (!/^\d{13,19}$/.test(data.card.number.replace(/\s/g, "")))
      errors.number = "Número de tarjeta inválido";
    if (!data.card.holderName.trim()) errors.holderName = "Ingresa el nombre en la tarjeta";
    if (!/^\d{2}\/\d{2}$/.test(data.card.expiration.trim())) errors.expiration = "Formato MM/AA";
    if (!/^\d{3,4}$/.test(data.card.cvv.trim())) errors.cvv = "Código inválido";
  }
  return errors;
}
