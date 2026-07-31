import { z } from "zod";

export const supplierSchema = z.object({
  companyName: z
    .string()
    .min(1, "El nombre de la empresa es obligatorio"),

  phone: z
    .string()
    .regex(
      /^\d{8}$/,
      "El teléfono debe contener exactamente 8 números",
    ),
});

export type SupplierForm = z.infer<typeof supplierSchema>;
