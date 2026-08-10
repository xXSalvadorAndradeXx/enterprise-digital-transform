import { z } from "zod";

import {
  ALLOWED_EMAIL_DOMAINS,
  ALLOWED_EMAIL_DOMAINS_MESSAGE,
} from "@/constants/allowed-email-domains";

/* ============================
 * Crear colaborador
 * ============================ */
export const agregarPersonaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .regex(
      /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/,
      "El nombre solo puede contener letras y espacios internos.",
    ),

  apellido: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio.")
    .min(3, "El apellido debe tener al menos 3 caracteres.")
    .max(80, "El apellido no puede superar los 80 caracteres.")
    .regex(
      /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/,
      "El apellido solo puede contener letras y espacios internos.",
    ),

  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingrese un correo electrónico válido.")
    .refine(
      (email) => {
        const domain = email.split("@").at(1);

        return (
          typeof domain === "string" &&
          ALLOWED_EMAIL_DOMAINS.some(
            (allowedDomain) =>
              domain === allowedDomain,
          )
        );
      },
      {
        message: ALLOWED_EMAIL_DOMAINS_MESSAGE,
      },
    ),

  rol: z
    .string()
    .min(1, "Debe seleccionar un rol."),

  telefono: z
    .string()
    .trim()
    .regex(
      /^(\+503\s?)?[267]\d{3}-\d{4}$/,
      "Ingrese un teléfono válido. Ejemplo: 6123-4567"
    ),
});

export type AgregarPersonaForm = z.infer<typeof agregarPersonaSchema>;

/* ============================
 * Editar colaborador
 * ============================ */
export const editarUsuarioSchema = z.object({
  nombreCompleto: z
    .string()
    .trim()
    .min(3, "El nombre es obligatorio.")
    .max(120, "El nombre no puede superar los 120 caracteres."),

  correo: z.email("Ingrese un correo válido."),

  nombreUsuario: z
    .string()
    .trim()
    .min(2, "El nombre de usuario es obligatorio."),

  rol: z
    .string()
    .min(1, "Debe seleccionar un rol."),

  estado: z.enum(
    ["activo", "desactivado"],
    {
      message: "Debe seleccionar un estado válido.",
    },
  ),
});

export type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;
