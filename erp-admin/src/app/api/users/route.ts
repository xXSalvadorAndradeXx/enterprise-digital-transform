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

export async function GET(request: NextRequest) {
  const backendApiUrl = getBackendApiUrl();
  const accessToken = await getAuthToken();

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

  const page =
    request.nextUrl.searchParams.get("page") ?? "1";

  const limit =
    request.nextUrl.searchParams.get("limit") ?? "10";

  const search =
    request.nextUrl.searchParams.get("search")?.trim();

  const params = new URLSearchParams({
    page,
    limit,
  });

  if (search) {
    params.set("search", search);
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(
      `${backendApiUrl}/users?${params.toString()}`,
      {
        method: "GET",
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
            "No fue posible obtener los usuarios.",
        },
        {
          status: backendResponse.status,
        },
      );
    }

    return NextResponse.json(responseBody, {
      status: 200,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === "AbortError";

    return NextResponse.json(
      {
        message: isTimeout
          ? "La consulta de usuarios superó el tiempo de espera."
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

export async function POST(request: NextRequest) {
  const backendApiUrl = getBackendApiUrl();
  const accessToken = await getAuthToken();

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

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "El cuerpo de la solicitud no contiene un JSON válido.",
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
      `${backendApiUrl}/users`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
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
            "No fue posible crear el usuario.",
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
          ? "La creación del usuario superó el tiempo de espera."
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