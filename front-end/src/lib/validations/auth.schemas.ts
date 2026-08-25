import { z } from "zod";

import type {
  LoginRequest,
  RegisterAddressStep,
  RegisterCredentialsStep,
  RegisterPersonalStep,
  RegisterRequest,
} from "@/types/auth/auth.types";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El correo electrónico es obligatorio.")
  .email("Ingresa un correo electrónico válido.");

export const loginPasswordSchema = z
  .string()
  .min(1, "La contraseña es obligatoria.");

export const registrationPasswordRequirements = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    message: "La contraseña debe tener al menos 8 caracteres.",
    isMet: (value: string) => value.length >= 8,
  },
  {
    id: "letterCase",
    label: "Una letra mayúscula y una minúscula",
    message:
      "La contraseña debe incluir al menos una mayúscula y una minúscula.",
    isMet: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value),
  },
  {
    id: "numberOrSymbol",
    label: "Un número o carácter especial (!@#$%^&*)",
    message: "La contraseña debe incluir al menos un número o un símbolo.",
    isMet: (value: string) => /[\d!@#$%^&*]/.test(value),
  },
] as const;

export const registrationPasswordSchema = z
  .string()
  .min(1, "La contraseña es obligatoria.")
  .superRefine((value, context) => {
    if (!value) {
      return;
    }

    registrationPasswordRequirements.forEach((requirement) => {
      if (!requirement.isMet(value)) {
        context.addIssue({
          code: "custom",
          message: requirement.message,
        });
      }
    });
  });

export const duiSchema = z
  .string()
  .trim()
  .min(1, "El DUI es obligatorio.")
  .regex(/^\d{8}-\d$/, "El DUI debe tener el formato 12345678-9.");

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean(),
}) satisfies z.ZodType<LoginRequest>;

export const registerPersonalStepSchema = z.strictObject({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio.")
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(150, "El nombre completo debe tener como máximo 150 caracteres."),
  dui: duiSchema,
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio.")
    .min(8, "El teléfono debe tener al menos 8 caracteres.")
    .max(20, "El teléfono debe tener como máximo 20 caracteres.")
    .regex(/^\+?\d+$/, "Ingresa un teléfono válido."),
}) satisfies z.ZodType<RegisterPersonalStep>;

export const registerCredentialsStepSchema = z.strictObject({
  email: emailSchema,
  password: registrationPasswordSchema,
}) satisfies z.ZodType<RegisterCredentialsStep>;

export const registerAddressStepSchema = z.strictObject({
  departmentId: z
    .string()
    .min(1, "Selecciona un departamento.")
    .uuid("Selecciona un departamento válido."),
  districtId: z
    .string()
    .min(1, "Selecciona un distrito.")
    .uuid("Selecciona un distrito válido."),
  city: z
    .string()
    .trim()
    .min(1, "La ciudad es obligatoria.")
    .max(120, "La ciudad debe tener como máximo 120 caracteres."),
  addressLine: z
    .string()
    .trim()
    .min(1, "La dirección es obligatoria.")
    .max(500, "La dirección debe tener como máximo 500 caracteres."),
}) satisfies z.ZodType<RegisterAddressStep>;

export const registerSchema = z.strictObject({
  ...registerPersonalStepSchema.shape,
  ...registerCredentialsStepSchema.shape,
  ...registerAddressStepSchema.shape,
}) satisfies z.ZodType<RegisterRequest>;
