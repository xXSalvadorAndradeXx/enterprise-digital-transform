import { z } from "zod";

export const supplierSchema = z.object({
  companyName: z
    .string()
    .min(1, "El nombre de la empresa es obligatorio"),

  phone: z
    .string()
    .regex(
      /^\+503\s\d{4}-\d{4}$/,
      "Número de teléfono inválido"
    ),
});

export type SupplierForm = z.infer<typeof supplierSchema>;