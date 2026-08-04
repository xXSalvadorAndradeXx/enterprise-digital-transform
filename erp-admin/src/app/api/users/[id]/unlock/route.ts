import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { getAuthToken } from "@/lib/session";

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

function getBackendApiUrl(): string | null {
  return (
    process.env.BACKEND_API_URL?.replace(/\/+$/, "") ??
    null
  );
}

async function readJsonResponse(
  response: Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  _request: NextRequest,
  context: RouteContext,
) {
  const backendApiUrl = getBackendApiUrl();
  const accessToken = await getAuthToken();
  const { id } = await context.params;

  if (!backendApiUrl) {
    return NextResponse.json(
      {
        message:
          "La URL del backend no está configurada.",
      },
      { status: 500 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "No existe una sesión activa.",
      },
      { status: 401 },
    );
  }

  if (!id) {
    return NextResponse.json(
      {
        message:
          "El identificador del usuario es obligatorio.",
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(
      `${backendApiUrl}/users/${encodeURIComponent(
        id,
      )}/unlock`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const responseBody =
      await readJsonResponse(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        responseBody ?? {
          message:
            "No fue posible desbloquear el usuario.",
        },
        {
          status: backendResponse.status,
        },
      );
    }

    return NextResponse.json(responseBody, {
      status: backendResponse.status,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === "AbortError";

    return NextResponse.json(
      {
        message: isTimeout
          ? "La solicitud de desbloqueo superó el tiempo de espera."
          : "No se pudo conectar con el servicio de usuarios.",
      },
      {
        status: isTimeout ? 504 : 503,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}