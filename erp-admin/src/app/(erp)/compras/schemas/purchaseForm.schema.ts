import { z } from "zod";

export const ALLOWED_INVOICE_TYPES = ["image/png", "image/jpeg", "application/pdf"] as const;
export const MAX_INVOICE_SIZE_BYTES = 10 * 1024 * 1024;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const invoiceSchema = z
  .custom<File>((value) => typeof File !== "undefined" && value instanceof File, "*Por favor, adjunta tu factura.")
  .refine((file) => ALLOWED_INVOICE_TYPES.includes(file.type as (typeof ALLOWED_INVOICE_TYPES)[number]), "*El formato de la factura no está permitido.")
  .refine((file) => file.size <= MAX_INVOICE_SIZE_BYTES, "*La factura no debe superar 10 MB.");

const requiredText = (message: string) => z.string().trim().min(1, message);
const quantitySchema = z.string().trim().regex(/^\d+$/, "*Ingresa una cantidad válida.").refine((value) => Number(value) > 0, "*La cantidad debe ser mayor que 0.");
const optionalQuantitySchema = z.string().superRefine((value, context) => { const clean = value.trim(); if (!clean) return; if (!/^\d+$/.test(clean) || Number(clean) <= 0) context.addIssue({ code: "custom", message: "*Ingresa una cantidad mayor que 0." }); });
const unitCostSchema = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "*Ingresa un costo válido.").refine((value) => Number(value) >= 0, "*El costo no puede ser negativo.");

export const newProductVariantSchema = z.object({
  id: z.string().min(1),
  size: requiredText("*Ingresa una talla."),
  color: z.string().trim().regex(HEX_COLOR, "*Usa un color hexadecimal, por ejemplo #000000."),
  quantity: quantitySchema,
  unitCost: unitCostSchema,
});

export const newProductSchema = z.object({
  name: requiredText("*El nombre del producto es requerido."),
  brand: requiredText("*La marca es requerida."),
  category: requiredText("*Selecciona una categoría."),
  variants: z.array(newProductVariantSchema).min(1),
  invoice: invoiceSchema,
}).superRefine((form, context) => {
  const seen = new Set<string>();
  form.variants.forEach((variant, index) => { const key = `${variant.size.toLowerCase()}|${variant.color.toUpperCase()}`; if (seen.has(key)) context.addIssue({ code: "custom", path: ["variants", index, "size"], message: "*La combinación talla-color está repetida." }); seen.add(key); });
});

export const restockRowSchema = z.object({
  id: z.string().min(1),
  size: z.string(),
  color: z.string(),
  currentStock: z.number().int().nonnegative(),
  quantity: optionalQuantitySchema,
  unitCost: z.string(),
  isNew: z.boolean().optional(),
}).superRefine((row, context) => {
  if (!row.quantity.trim() && !row.isNew) return;
  if (!row.size.trim()) context.addIssue({ code: "custom", path: ["size"], message: "*Ingresa una talla." });
  if (!HEX_COLOR.test(row.color.trim())) context.addIssue({ code: "custom", path: ["color"], message: "*Usa un color hexadecimal." });
  const cost = unitCostSchema.safeParse(row.unitCost); if (!cost.success) context.addIssue({ code: "custom", path: ["unitCost"], message: cost.error.issues[0]?.message ?? "*Costo inválido." });
  const quantity = quantitySchema.safeParse(row.quantity); if (!quantity.success) context.addIssue({ code: "custom", path: ["quantity"], message: quantity.error.issues[0]?.message ?? "*Cantidad inválida." });
});

export const restockSchema = z.object({
  selectedProductId: requiredText("*Selecciona un producto existente."),
  search: z.string(),
  sizes: z.array(restockRowSchema).min(1),
  invoice: invoiceSchema,
}).superRefine((form, context) => {
  if (!form.sizes.some((row) => Number(row.quantity) > 0)) context.addIssue({ code: "custom", path: ["sizes"], message: "*Ingresa una cantidad en al menos una talla." });
  const seen = new Set<string>();
  form.sizes.filter((row) => row.isNew).forEach((row, index) => { const key = `${row.size.trim().toLowerCase()}|${row.color.trim().toUpperCase()}`; if (seen.has(key)) context.addIssue({ code: "custom", path: ["sizes", index, "size"], message: "*La nueva talla-color está repetida." }); seen.add(key); });
});

export const editPurchaseSchema = z.object({
  date: requiredText("*Selecciona la fecha."), supplierId: requiredText("*Selecciona el proveedor."), productId: z.string().min(1), name: requiredText("*El nombre del producto es requerido."), brand: requiredText("*La marca es requerida."), category: requiredText("*Selecciona una categoría."), variants: z.array(newProductVariantSchema).min(1),
  existingInvoice: z.object({ name: z.string(), mimeType: z.string(), url: z.string() }).nullable(), replacementInvoice: invoiceSchema.nullable(),
}).superRefine((form, context) => { if (!form.existingInvoice && !form.replacementInvoice) context.addIssue({ code: "custom", path: ["replacementInvoice"], message: "*Por favor, adjunta tu factura." }); });

export type NewProductVariantInput = z.input<typeof newProductVariantSchema>;
export type NewProductFormInput = z.input<typeof newProductSchema>;
export type RestockRowInput = z.input<typeof restockRowSchema>;
export type RestockFormInput = z.input<typeof restockSchema>;
export type InvoiceInput = z.input<typeof invoiceSchema>;
export type EditPurchaseInput = z.input<typeof editPurchaseSchema>;
