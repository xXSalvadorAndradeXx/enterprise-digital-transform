import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  getAuthToken,
  setMustChangePasswordRequirement,
} from "@/lib/session";

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

export async function POST(request: NextRequest) {
  const backendApiUrl = getBackendApiUrl();
  const accessToken = await getAuthToken();

  if (!backendApiUrl) {
    return NextResponse.json(
      { message: "La URL del backend no está configurada." },
      { status: 500 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { message: "No existe una sesión activa." },
      { status: 401 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no contiene un JSON válido." },
      { status: 400 },
    );
  }

  if (
    !isRecord(requestBody) ||
    typeof requestBody.currentPassword !== "string" ||
    typeof requestBody.newPassword !== "string"
  ) {
    return NextResponse.json(
      { message: "Los datos para cambiar la contraseña son inválidos." },
      { status: 422 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(
      `${backendApiUrl}/auth/change-password`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: requestBody.currentPassword,
          newPassword: requestBody.newPassword,
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const responseBody =
      await readJsonResponse(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        responseBody ?? {
          message: "No fue posible cambiar la contraseña.",
        },
        { status: backendResponse.status },
      );
    }

    await setMustChangePasswordRequirement(false);

    return NextResponse.json(
      responseBody ?? {
        message: "Contraseña actualizada exitosamente",
      },
      { status: 200 },
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === "AbortError";

    return NextResponse.json(
      {
        message: isTimeout
          ? "El cambio de contraseña superó el tiempo de espera."
          : "No se pudo conectar con el servicio de autenticación.",
      },
      { status: isTimeout ? 504 : 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
