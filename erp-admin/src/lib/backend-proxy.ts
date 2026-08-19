import {
  getAuthToken,
} from "@/lib/session";

function getBackendApiUrl(): string {
  const backendApiUrl =
    process.env.BACKEND_API_URL
      ?.replace(/\/+$/, "");

  if (!backendApiUrl) {
    throw new Error(
      "BACKEND_API_URL no está configurada.",
    );
  }

  return backendApiUrl;
}

export async function getBackendAuthHeaders(
  options?: {
    contentType?: string | null;
  },
): Promise<Headers> {
  const token =
    await getAuthToken();

  const headers =
    new Headers();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  if (
    options?.contentType !==
    null
  ) {
    headers.set(
      "Content-Type",
      options?.contentType ??
        "application/json",
    );
  }

  return headers;
}

export function getBackendUrl(
  path: string,
): string {
  const backendApiUrl =
    getBackendApiUrl();

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${backendApiUrl}${normalizedPath}`;
}

/**
 * Convierte una respuesta del Backend
 * en una Response para el cliente,
 * conservando status y body.
 */
export async function forwardBackendResponse(
  response: Response,
): Promise<Response> {
  /**
   * 204 no tiene contenido.
   */
  if (
    response.status === 204
  ) {
    return new Response(
      null,
      {
        status: 204,
      },
    );
  }

  const body =
    await response.text();

  const contentType =
    response.headers.get(
      "content-type",
    ) ??
    "application/json";

  return new Response(
    body,
    {
      status:
        response.status,

      headers: {
        "Content-Type":
          contentType,
      },
    },
  );
}

/**
 * Respuesta estándar cuando Next.js
 * no encuentra una sesión autenticada.
 */
export function unauthorizedResponse():
  Response {
  return Response.json(
    {
      statusCode: 401,
      error:
        "Unauthorized",
      message:
        "Sesión no autenticada.",
    },
    {
      status: 401,
    },
  );
}