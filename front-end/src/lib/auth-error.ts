import { ApiRequestError } from "@/lib/api-client";

export type AuthErrorScope =
  | "field"
  | "session"
  | "business"
  | "network"
  | "unexpected";

export type AuthErrorField =
  | "email"
  | "dui"
  | "password"
  | "departmentId"
  | "districtId";

export type NormalizedAuthError = {
  scope: AuthErrorScope;
  fields: readonly AuthErrorField[];
  message: string;
};

const GENERIC_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Inténtalo nuevamente.";

export function normalizeAuthError(error: unknown): NormalizedAuthError {
  if (!(error instanceof ApiRequestError)) {
    return {
      scope: "unexpected",
      fields: [],
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return {
        scope: "business",
        fields: [],
        message: "Correo o contraseña incorrectos.",
      };

    case "EMAIL_ALREADY_EXISTS":
      return {
        scope: "field",
        fields: ["email"],
        message: "Este correo electrónico ya está registrado.",
      };

    case "DUI_ALREADY_EXISTS":
      return {
        scope: "field",
        fields: ["dui"],
        message: "Este DUI ya está registrado.",
      };

    case "INVALID_PASSWORD":
      return {
        scope: "field",
        fields: ["password"],
        message: "La contraseña no cumple con los requisitos de seguridad.",
      };

    case "INVALID_LOCATION":
      return {
        scope: "field",
        fields: ["departmentId", "districtId"],
        message: "La ubicación seleccionada no es válida.",
      };
  }

  if (error.status === 0) {
    return {
      scope: "network",
      fields: [],
      message: "No se pudo conectar con el servidor. Inténtalo nuevamente.",
    };
  }

  if (error.status === 401) {
    return {
      scope: "session",
      fields: [],
      message: "No fue posible validar tus credenciales.",
    };
  }

  if (error.status === 409) {
    return {
      scope: "business",
      fields: [],
      message: "Los datos ingresados ya están registrados.",
    };
  }

  if (error.status >= 500) {
    return {
      scope: "unexpected",
      fields: [],
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  return {
    scope: "unexpected",
    fields: [],
    message: GENERIC_ERROR_MESSAGE,
  };
}
