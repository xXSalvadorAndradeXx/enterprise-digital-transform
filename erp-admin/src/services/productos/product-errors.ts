import type {
  ApiErrorResponse,
} from "@/types/api-error.types";

export type ProductHttpErrorType =
  | "BAD_REQUEST"
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
  path?: string;
  timestamp?: string;
}

function getErrorType(
  status: number,
): ProductHttpErrorType {
  switch (status) {
    case 400:
      return "BAD_REQUEST";

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
      return status >= 500
        ? "SERVER"
        : "UNKNOWN";
  }
}

export async function normalizeProductHttpError(
  response: Response,
): Promise<ProductHttpError> {
  try {
    const body =
      (await response.json()) as ApiErrorResponse;

    return {
      status: body.statusCode,
      type: getErrorType(
        body.statusCode,
      ),
      message: body.message,
      path: body.path,
      timestamp: body.timestamp,
    };
  } catch {
    return {
      status: response.status,
      type: getErrorType(
        response.status,
      ),
      message:
        "No se pudo completar la solicitud.",
    };
  }
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