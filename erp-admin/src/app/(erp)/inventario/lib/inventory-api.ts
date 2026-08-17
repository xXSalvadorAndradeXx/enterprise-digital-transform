import { NextResponse } from "next/server";

import { getAuthToken } from "@/lib/session";

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

function getBackendApiUrl(): string | null {
  return process.env.BACKEND_API_URL?.replace(/\/+$/, "") ?? null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function forwardInventoryRequest(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const accessToken = await getAuthToken();

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "No existe una sesión activa.",
      },
      { status: 401 },
    );
  }

  const backendApiUrl = getBackendApiUrl();

  if (!backendApiUrl) {
    return NextResponse.json(
      {
        message: "El servicio de inventario no está configurado.",
      },
      { status: 500 },
    );
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${backendApiUrl}${path}`,
      {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const body = await readResponseBody(response);

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
      });
    }

    return NextResponse.json(body, {
      status: response.status,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === "AbortError";

    return NextResponse.json(
      {
        message: isTimeout
          ? "La solicitud de inventario superó el tiempo de espera."
          : "No se pudo conectar con el servicio de inventario.",
      },
      {
        status: isTimeout ? 504 : 503,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}