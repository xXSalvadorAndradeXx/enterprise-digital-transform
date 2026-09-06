import { z } from "zod";

import type { UpdateCustomerProfileRequest } from "@/types/profile/profile.types";

const PROFILE_NAME_FORMAT =
  /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const PROFILE_PHONE_FORMAT =
  /^(?:\d{8}|\d{4}-\d{4}|\+503\d{8}|\+503 \d{4}-\d{4})$/;
const PROFILE_PHONE_FORMAT_MESSAGE =
  "Ingresa un teléfono salvadoreño de 8 dígitos. Ejemplo: 7123-4567 o +503 7123-4567.";

function getLocalPhone(phone: string): string {
  const compactPhone = phone.trim().replace(/[ -]/g, "");

  return compactPhone.startsWith("+503")
    ? compactPhone.slice(4)
    : compactPhone;
}

export const updateCustomerProfileSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .superRefine((name, context) => {
      if (name.length === 0) {
        context.addIssue({
          code: "custom",
          message: "Ingresa tu nombre.",
        });
        return;
      }

      if (name.length < 3) {
        context.addIssue({
          code: "custom",
          message: "El nombre debe tener al menos 3 caracteres.",
        });
        return;
      }

      if (name.length > 150) {
        context.addIssue({
          code: "custom",
          message: "El nombre no puede superar los 150 caracteres.",
        });
        return;
      }

      if (!PROFILE_NAME_FORMAT.test(name)) {
        context.addIssue({
          code: "custom",
          message: "Ingresa un nombre válido usando letras y espacios.",
        });
      }
    }),
  phone: z
    .string()
    .trim()
    .superRefine((phone, context) => {
      if (phone.length === 0) {
        context.addIssue({
          code: "custom",
          message: "Ingresa tu número de teléfono.",
        });
        return;
      }

      if (!PROFILE_PHONE_FORMAT.test(phone)) {
        context.addIssue({
          code: "custom",
          message: PROFILE_PHONE_FORMAT_MESSAGE,
        });
        return;
      }

      const localPhone = getLocalPhone(phone);

      if (!/^\d{8}$/.test(localPhone)) {
        context.addIssue({
          code: "custom",
          message: PROFILE_PHONE_FORMAT_MESSAGE,
        });
        return;
      }

      if (!/^[267]/.test(localPhone)) {
        context.addIssue({
          code: "custom",
          message: "El teléfono debe comenzar con 2, 6 o 7.",
        });
      }
    }),
}) satisfies z.ZodType<UpdateCustomerProfileRequest>;

export function normalizeProfilePhone(phone: string): string {
  return getLocalPhone(phone);
}
