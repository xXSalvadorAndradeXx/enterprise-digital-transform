import { z } from "zod";

export const checkoutSourceSchema = z.enum(["CART", "BUY_NOW"]);

export const deliveryTypeSchema = z.enum([
  "HOME_DELIVERY",
  "STORE_PICKUP",
]);

export const paymentMethodSchema = z.enum([
  "CARD",
  "PAY_AT_STORE",
]);

export const customerTypeSchema = z.enum([
  "REGISTERED",
  "GUEST",
]);

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const homeDeliverySchema = z.object({
  departmentId: z.string().uuid(),
  districtId: z.string().uuid(),
  city: z.string().min(1),
  addressLine: z.string().min(1),
});

export const storePickupSchema = z.object({
  branchId: z.string().uuid(),
});

export const checkoutContactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  dui: z.string().min(1),
  phone: z.string().min(1),
});

export const checkoutCardSchema = z.object({
  number: z.string().min(1),
  holderName: z.string().min(1),
  expiration: z.string().min(1),
  cvv: z.string().min(3).max(4),
});

export const checkoutPreviewRequestSchema = z.object({
  source: checkoutSourceSchema,
  deliveryType: deliveryTypeSchema,
  delivery: z.union([
    homeDeliverySchema,
    storePickupSchema,
  ]),
  paymentMethod: paymentMethodSchema,
});

export const checkoutCartRequestSchema = z.object({
  source: z.literal("CART"),
  customerType: customerTypeSchema,
  contact: checkoutContactSchema,
  deliveryType: deliveryTypeSchema,
  delivery: z.union([
    homeDeliverySchema,
    storePickupSchema,
  ]),
  paymentMethod: paymentMethodSchema,
  saveAddress: z.boolean(),
  card: checkoutCardSchema.optional(),
});

export const checkoutBuyNowRequestSchema = z.object({
  source: z.literal("BUY_NOW"),
  items: z.array(checkoutItemSchema).min(1),
  customerType: customerTypeSchema,
  contact: checkoutContactSchema,
  deliveryType: deliveryTypeSchema,
  delivery: z.union([
    homeDeliverySchema,
    storePickupSchema,
  ]),
  paymentMethod: paymentMethodSchema,
  saveAddress: z.boolean(),
  card: checkoutCardSchema.optional(),
});

export const checkoutRequestSchema = z.discriminatedUnion("source", [
  checkoutCartRequestSchema,
  checkoutBuyNowRequestSchema,
]);