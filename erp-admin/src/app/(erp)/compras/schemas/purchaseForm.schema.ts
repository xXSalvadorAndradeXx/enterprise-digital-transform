import { z } from "zod";

export const ALLOWED_INVOICE_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
] as const;

export const invoiceSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "*Por favor, adjunta tu factura.",
  )
  .refine(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      ALLOWED_INVOICE_TYPES.includes(
        file.type as (typeof ALLOWED_INVOICE_TYPES)[number],
      ),
    "*El formato de la factura no está permitido.",
  );

const quantitySchema = z.string().superRefine((value, context) => {
  const normalized = value.trim();
  if (/^-\d+$/.test(normalized)) {
    context.addIssue({
      code: "custom",
      message: "*La cantidad no puede ser negativa.",
    });
    return;
  }
  if (!/^\d+$/.test(normalized)) {
    context.addIssue({
      code: "custom",
      message: "*Ingresa una cantidad válida.",
    });
  }
});

const unitCostSchema = z
  .string()
  .min(1, "*El costo unitario es requerido.")
  .refine(
    (value) => value.trim() === "" || /^-?\d+(?:\.\d+)?$/.test(value.trim()),
    "*Ingresa un costo válido.",
  )
  .refine(
    (value) =>
      value.trim() === "" ||
      !/^-?\d+(?:\.\d+)?$/.test(value.trim()) ||
      Number(value) > 0,
    "*El costo debe ser mayor que 0.",
  );

export const newProductVariantSchema = z
  .object({
    id: z.string().min(1),
    size: z.string(),
    quantity: quantitySchema,
    unitCost: unitCostSchema,
  })
  .superRefine((variant, context) => {
    if (
      (variant.quantity.trim() !== "" || variant.unitCost.trim() !== "") &&
      variant.size.trim() === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message: "*Ingresa una talla.",
      });
    }
  });

export const newProductSchema = z
  .object({
    name: z.string().trim().min(1, "*El nombre del producto es requerido."),
    category: z.string().min(1, "*Selecciona una categoría."),
    variants: z.array(newProductVariantSchema).min(1),
    invoice: invoiceSchema,
  })
  .superRefine((form, context) => {
    const hasPositiveQuantity = form.variants.some(
      (variant) =>
        /^\d+$/.test(variant.quantity.trim()) && Number(variant.quantity) > 0,
    );
    if (!hasPositiveQuantity) {
      context.addIssue({
        code: "custom",
        path: ["variants"],
        message: "*Agrega al menos una variante con cantidad mayor que 0.",
      });
    }
  });

const restockQuantitySchema = z.string().superRefine((value, context) => {
  const normalized = value.trim();
  if (normalized === "") return;
  if (!/^\d+$/.test(normalized)) {
    context.addIssue({
      code: "custom",
      message: "*Ingresa una cantidad válida.",
    });
  }
});

export const restockRowSchema = z.object({
  size: z.string().min(1),
  currentStock: z.number().int().nonnegative(),
  quantity: restockQuantitySchema,
});

export const restockSchema = z
  .object({
    selectedProductId: z
      .string()
      .min(1, "*Selecciona un producto existente."),
    search: z.string(),
    sizes: z.array(restockRowSchema).min(1),
    invoice: invoiceSchema,
  })
  .superRefine((form, context) => {
    const hasPositiveQuantity = form.sizes.some(
      (row) => /^\d+$/.test(row.quantity.trim()) && Number(row.quantity) > 0,
    );
    if (!hasPositiveQuantity) {
      context.addIssue({
        code: "custom",
        path: ["sizes"],
        message: "*Ingresa una cantidad mayor que 0 en al menos una talla.",
      });
    }
  });

export type NewProductVariantInput = z.input<typeof newProductVariantSchema>;
export type NewProductFormInput = z.input<typeof newProductSchema>;
export type RestockRowInput = z.input<typeof restockRowSchema>;
export type RestockFormInput = z.input<typeof restockSchema>;
export type InvoiceInput = z.input<typeof invoiceSchema>;
