export type ProductHttpErrorType =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "SERVER"
  | "UNKNOWN";

export interface ProductHttpError {
  status: number;
  type: ProductHttpErrorType;
  message: string;
}

function getErrorType(
  status: number,
): ProductHttpErrorType {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";

    case 403:
      return "FORBIDDEN";

    case 404:
      return "NOT_FOUND";

    case 409:
      return "CONFLICT";

    case 422:
      return "VALIDATION";

    default:
      if (status >= 500) {
        return "SERVER";
      }

      return "UNKNOWN";
  }
}

function getFallbackMessage(
  status: number,
): string {
  switch (status) {
    case 401:
      return "Tu sesión no es válida o ha expirado.";

    case 403:
      return "No tienes permisos para realizar esta acción.";

    case 404:
      return "El recurso solicitado no fue encontrado.";

    case 409:
      return "La operación genera un conflicto con la información existente.";

    case 422:
      return "Los datos enviados no son válidos.";

    default:
      if (status >= 500) {
        return "Ocurrió un error interno en el servidor.";
      }

      return "No se pudo completar la solicitud.";
  }
}

export async function normalizeProductHttpError(
  response: Response,
): Promise<ProductHttpError> {
  let message =
    getFallbackMessage(
      response.status,
    );

  try {
    const body: unknown =
      await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body
    ) {
      const responseMessage =
        body.message;

      if (
        typeof responseMessage ===
        "string"
      ) {
        message =
          responseMessage;
      }

      if (
        Array.isArray(
          responseMessage,
        )
      ) {
        message =
          responseMessage
            .filter(
              (
                item,
              ): item is string =>
                typeof item ===
                "string",
            )
            .join(", ");
      }
    }
  } catch {
    /*
     * Si Backend no devuelve JSON en el error,
     * conservamos el mensaje de respaldo.
     */
  }

  return {
    status:
      response.status,

    type:
      getErrorType(
        response.status,
      ),

    message,
  };
}

export function isProductHttpError(
  error: unknown,
): error is ProductHttpError {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  return (
    "status" in error &&
    "type" in error &&
    "message" in error
  );
}