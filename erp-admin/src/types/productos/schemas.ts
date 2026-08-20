import { z } from "zod";

const MAX_PRODUCT_IMAGES = 5;
const MAX_PRODUCT_TAGS = 20;

export const productFormSchema = z
  .object({
    inventoryId: z
      .string()
      .trim()
      .min(
        1,
        "Debes seleccionar un producto del inventario.",
      ),

    commercialName: z
      .string()
      .trim()
      .min(
        1,
        "El nombre comercial es requerido.",
      )
      .min(
        2,
        "El nombre comercial debe tener al menos 2 caracteres.",
      )
      .max(
        200,
        "El nombre comercial no puede superar 200 caracteres.",
      ),

    salePrice: z
      .string()
      .trim()
      .min(
        1,
        "El precio de venta es requerido.",
      )
      .refine(
        (value) => {
          const price = Number(value);

          return (
            !Number.isNaN(price) &&
            price >= 0
          );
        },
        {
          message:
            "El precio de venta debe ser mayor o igual a 0.",
        },
      ),

    applyDiscount:
      z.boolean(),

    discount:
      z.string(),

    discountStartsAt:
      z.string(),

    discountEndsAt:
      z.string(),

    description: z
      .string()
      .trim()
      .max(
        5000,
        "La descripción no puede superar 5000 caracteres.",
      ),

    tags: z
      .array(
        z
          .string()
          .trim()
          .min(
            1,
            "Las etiquetas no pueden contener solo espacios.",
          ),
      )
      .max(
        MAX_PRODUCT_TAGS,
        `Se permite un máximo de ${MAX_PRODUCT_TAGS} etiquetas.`,
      ),

    imageUrls: z
      .array(
        z
          .string()
          .url(
            "La URL de la imagen no es válida.",
          ),
      )
      .max(
        MAX_PRODUCT_IMAGES,
        `Se permite un máximo de ${MAX_PRODUCT_IMAGES} imágenes.`,
      ),

    status: z
      .string()
      .min(
        1,
        "Debes seleccionar un estado de publicación.",
      )
      .refine(
        (value) =>
          value === "DRAFT" ||
          value === "ACTIVE",
        {
          message:
            "El estado de publicación seleccionado no es válido.",
        },
      ),
  })
  .superRefine(
    (data, ctx) => {
      /*
       * Si el descuento está desactivado,
       * las fechas y el porcentaje no
       * son obligatorios.
       */
      if (!data.applyDiscount) {
        return;
      }

      const discount =
        Number(
          data.discount,
        );

      if (
        data.discount.trim() === "" ||
        Number.isNaN(discount)
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discount",
          ],

          message:
            "Debes ingresar un porcentaje de descuento.",
        });

        return;
      }

      if (
        discount < 0 ||
        discount > 100
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discount",
          ],

          message:
            "El descuento debe estar entre 0 y 100.",
        });
      }

      /*
       * Fecha inicial.
       */
      if (
        !data.discountStartsAt.trim()
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discountStartsAt",
          ],

          message:
            "Debes seleccionar la fecha inicial del descuento.",
        });
      }

      /*
       * Fecha final.
       */
      if (
        !data.discountEndsAt.trim()
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discountEndsAt",
          ],

          message:
            "Debes seleccionar la fecha final del descuento.",
        });
      }

      /*
       * Si falta alguna fecha no podemos
       * realizar las comparaciones.
       */
      if (
        !data.discountStartsAt.trim() ||
        !data.discountEndsAt.trim()
      ) {
        return;
      }

      const startDate =
        new Date(
          `${data.discountStartsAt}T00:00:00`,
        );

      const endDate =
        new Date(
          `${data.discountEndsAt}T23:59:59`,
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0,
      );

      /*
       * No permitir iniciar un descuento
       * en una fecha pasada.
       */
      if (
        startDate < today
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discountStartsAt",
          ],

          message:
            "La fecha inicial del descuento no puede estar en el pasado.",
        });
      }

      /*
       * Conservamos la validación que
       * ya existía para la fecha final.
       */
      if (
        endDate < today
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discountEndsAt",
          ],

          message:
            "La fecha final del descuento no puede estar en el pasado.",
        });
      }

      /*
       * Regla del contrato Backend:
       * el inicio debe ser anterior
       * al final.
       */
      if (
        startDate >= endDate
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "discountEndsAt",
          ],

          message:
            "La fecha final del descuento debe ser posterior a la fecha inicial.",
        });
      }
    },
  );

export type ProductFormInput =
  z.input<
    typeof productFormSchema
  >;

export type ProductFormSchema =
  z.output<
    typeof productFormSchema
  >;