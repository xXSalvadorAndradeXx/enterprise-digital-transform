import {
  ProveedorServiceError,
  type ApiErrorPayload,
} from "@/types/proveedor/proveedor.types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeErrorPayload(value: unknown): ApiErrorPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const message =
    typeof value.message === "string" ||
    (Array.isArray(value.message) &&
      value.message.every((item) => typeof item === "string"))
      ? value.message
      : undefined;

  return {
    ...(message ? { message } : {}),
    ...(typeof value.error === "string"
      ? { error: value.error }
      : {}),
    ...(typeof value.statusCode === "number"
      ? { statusCode: value.statusCode }
      : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(
  payload: ApiErrorPayload | null,
): string {
  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (Array.isArray(payload?.message)) {
    return payload.message.join(" ");
  }

  return "No se pudo completar la operación de proveedores.";
}

export async function requestProveedores(
  input: string,
  init?: RequestInit,
): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
  });
  const body = await readJson(response);

  if (!response.ok) {
    const payload = normalizeErrorPayload(body);

    throw new ProveedorServiceError(
      getErrorMessage(payload),
      response.status,
      payload,
    );
  }

  return { response, body };
}
