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

export const registrationPasswordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .regex(/[A-Z]/, "La contraseña debe incluir al menos una mayúscula.")
  .regex(/[a-z]/, "La contraseña debe incluir al menos una minúscula.")
  .regex(/\d/, "La contraseña debe incluir al menos un número.")
  .regex(
    /[^A-Za-z0-9\s]/,
    "La contraseña debe incluir al menos un símbolo.",
  );

export const duiSchema = z
  .string()
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
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(150, "El nombre completo debe tener como máximo 150 caracteres."),
  dui: duiSchema,
  phone: z
    .string()
    .trim()
    .min(8, "El teléfono debe tener al menos 8 caracteres.")
    .max(20, "El teléfono debe tener como máximo 20 caracteres."),
}) satisfies z.ZodType<RegisterPersonalStep>;

export const registerCredentialsStepSchema = z.strictObject({
  email: emailSchema,
  password: registrationPasswordSchema,
}) satisfies z.ZodType<RegisterCredentialsStep>;

export const registerAddressStepSchema = z.strictObject({
  departmentId: z
    .string()
    .uuid("El identificador del departamento debe ser un UUID válido."),
  districtId: z
    .string()
    .uuid("El identificador del distrito debe ser un UUID válido."),
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
