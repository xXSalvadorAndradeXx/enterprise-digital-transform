type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

/**
 * Acepta tanto la respuesta histórica del backend como el contrato ApiSuccess.
 */
export function unwrapApiSuccess<T>(response: unknown): T {
  if (
    isRecord(response) &&
    response.success === true &&
    "data" in response
  ) {
    return response.data as T;
  }

  return response as T;
}
