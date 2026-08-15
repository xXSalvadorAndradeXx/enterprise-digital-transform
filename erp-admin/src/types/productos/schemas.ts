import { z } from "zod";

export const productFormSchema = z
  .object({
    commercialName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(200, "El nombre no puede superar 200 caracteres."),

    salePrice: z
      .string()
      .min(1, "El precio de venta es requerido.")
      .refine(
        (value) =>
          !Number.isNaN(Number(value)) &&
          Number(value) >= 0,
        "El precio debe ser mayor o igual a 0.",
      ),

    applyDiscount: z.boolean(),

    discount: z.string(),

    discountEndsAt: z.string(),

    description: z
      .string()
      .max(
        5000,
        "La descripción no puede superar 5000 caracteres.",
      ),

    tags: z
      .array(z.string())
      .max(20, "Se permite un máximo de 20 etiquetas."),

    imageUrls: z
      .array(z.string())
      .max(10, "Se permite un máximo de 10 imágenes."),

    status: z
    .string()
    .min(
        1,
        "Selecciona un estado de publicación.",
    )
    .refine(
        (value) =>
        value === "DRAFT" ||
        value === "ACTIVE",
        "Selecciona un estado de publicación válido.",
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.applyDiscount) {
      return;
    }

    const discount = Number(data.discount);

    if (
      Number.isNaN(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount"],
        message:
          "El descuento debe estar entre 0 y 100.",
      });
    }

    if (discount > 0 && !data.discountEndsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountEndsAt"],
        message:
          "La fecha final es requerida cuando existe un descuento.",
      });
    }
  });

export type ProductFormSchema =
  z.infer<typeof productFormSchema>;