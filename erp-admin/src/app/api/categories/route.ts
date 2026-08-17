import { NextResponse } from "next/server";

import { getAuthToken } from "@/lib/session";

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

function getBackendApiUrl(): string | null {
  return process.env.BACKEND_API_URL?.replace(/\/+$/, "") ?? null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  const accessToken = await getAuthToken();

  if (!accessToken) {
    return NextResponse.json(
      { message: "No existe una sesión activa." },
      { status: 401 },
    );
  }

  const backendApiUrl = getBackendApiUrl();

  if (!backendApiUrl) {
    return NextResponse.json(
      { message: "El servicio de categorías no está configurado." },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendApiUrl}/categories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    return NextResponse.json(await readResponseBody(response), {
      status: response.status,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        message: isTimeout
          ? "La solicitud de categorías superó el tiempo de espera."
          : "No se pudo conectar con el servicio de categorías.",
      },
      { status: isTimeout ? 504 : 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
