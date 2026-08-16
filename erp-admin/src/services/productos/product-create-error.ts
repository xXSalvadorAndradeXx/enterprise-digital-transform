import type {
  ProductHttpError,
} from "./product-errors";

export function getCreateProductErrorMessage(
  error: ProductHttpError,
): string {
  switch (error.type) {
    case "UNAUTHORIZED":
      return "Tu sesión no es válida o ha expirado.";

    case "FORBIDDEN":
      return "No tienes permisos para crear productos.";

    case "NOT_FOUND":
      return "El inventario seleccionado ya no existe.";

    case "CONFLICT":
      /*
       * Backend debe indicar el motivo concreto
       * del conflicto: inventario sin stock o
       * inventario previamente vinculado.
       *
       * Conservamos su mensaje para no ocultar
       * información contractual.
       */
      return error.message;

    case "VALIDATION":
      return error.message;

    case "SERVER":
      return "Ocurrió un problema en el servidor al crear el producto.";

    default:
      return error.message;
  }
}