import { NextResponse, type NextRequest } from "next/server";

import { setAuthToken } from "@/lib/session";
import type {
  AuthErrorType,
  AuthUser,
  LoginRequest,
  PublicAuthSession,
} from "@/types/auth/auth.types";

const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

const VALIDATION_MESSAGE = "Datos de inicio de sesión inválidos.";
const NETWORK_MESSAGE =
  "No se pudo conectar con el servicio de autenticación.";
const SERVER_MESSAGE =
  "El servicio de autenticación no está disponible.";
const TIMEOUT_MESSAGE =
  "La solicitud de autenticación superó el tiempo de espera.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getBackendApiUrl(): string | null {
  return process.env.BACKEND_API_URL?.replace(/\/+$/, "") ?? null;
}

function createErrorResponse(
  type: AuthErrorType,
  message: string,
  status: number,
  messages?: string[],
) {
  return NextResponse.json(
    messages?.length
      ? {
          type,
          message,
          messages,
        }
      : {
          type,
          message,
        },
    { status },
  );
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeLoginRequest(body: unknown): LoginRequest | null {
  if (!isRecord(body)) {
    return null;
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return null;
  }

  const email = body.email.trim();

  if (email.length === 0 || body.password.trim().length === 0) {
    return null;
  }

  return {
    email,
    password: body.password,
  };
}

function getBackendMessages(body: unknown): string[] {
  if (!isRecord(body)) {
    return [];
  }

  if (Array.isArray(body.message)) {
    return body.message.filter(
      (message): message is string =>
        typeof message === "string",
    );
  }

  if (typeof body.message === "string") {
    return [body.message];
  }

  return [];
}

function getBackendMessage(body: unknown): string | undefined {
  const messages = getBackendMessages(body);

  return messages.length > 0
    ? messages.join(" ")
    : undefined;
}

function getValidationMessage(body: unknown): string {
  return getBackendMessage(body) ?? VALIDATION_MESSAGE;
}

function normalizeCredentialError(message?: string): {
  type: AuthErrorType;
  message: string;
} {
  const normalizedMessage = message?.trim().toLowerCase() ?? "";

  if (
    normalizedMessage.includes("usuario no está registrado") ||
    normalizedMessage.includes("usuario no registrado") ||
    normalizedMessage.includes("user not found")
  ) {
    return {
      type: "user_not_registered",
      message: "El usuario no está registrado.",
    };
  }

  if (
    normalizedMessage.includes("contraseña es incorrecta") ||
    normalizedMessage.includes("contraseña incorrecta") ||
    normalizedMessage.includes("incorrect password")
  ) {
    return {
      type: "incorrect_password",
      message: "La contraseña es incorrecta.",
    };
  }

  if (
    normalizedMessage.includes("usuario inactivo") ||
    normalizedMessage.includes("cuenta inactiva") ||
    normalizedMessage.includes("inactive")
  ) {
    return {
      type: "user_inactive",
      message: "Usuario inactivo",
    };
  }

  /*
   * Respuesta segura por defecto.
   *
   * Backend actualmente puede responder solamente
   * "Credenciales inválidas", sin indicar cuál campo falló.
   */
  return {
    type: "invalid_credentials",
    message: "Usuario o contraseña incorrectos.",
  };
}

function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    typeof value.id === "string"
      ? value.id
      : typeof value.userId === "string"
        ? value.userId
        : null;

  const email =
    typeof value.email === "string"
      ? value.email
      : null;

  const rol =
    typeof value.rol === "string"
      ? value.rol
      : null;

  if (!id || !email || !rol) {
    return null;
  }

  const nombre =
    typeof value.nombre === "string" &&
    value.nombre.trim().length > 0
      ? value.nombre.trim()
      : undefined;

  return {
    id,
    email,
    rol,
    ...(nombre ? { nombre } : {}),
  };
}

function normalizeBackendLoginResponse(
  body: unknown,
): {
  accessToken: string;
  session: PublicAuthSession;
} | null {
  if (!isRecord(body)) {
    return null;
  }

  /*
   * Se aceptan ambos nombres mientras se estabiliza
   * el contrato del backend.
   */
  const accessToken =
    typeof body.accessToken === "string"
      ? body.accessToken
      : typeof body.access_token === "string"
        ? body.access_token
        : null;

  const user = normalizeAuthUser(body.user);

  if (!accessToken || !user) {
    return null;
  }

  return {
    accessToken,
    session: {
      user,
      isAuthenticated: true,
    },
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse(
      "validation",
      VALIDATION_MESSAGE,
      422,
    );
  }

  const loginRequest = normalizeLoginRequest(body);

  if (!loginRequest) {
    return createErrorResponse(
      "validation",
      VALIDATION_MESSAGE,
      422,
    );
  }

  const backendApiUrl = getBackendApiUrl();

  if (!backendApiUrl) {
    return createErrorResponse(
      "server",
      SERVER_MESSAGE,
      500,
    );
  }

  const controller = new AbortController();
  let timeoutReached = false;

  const timeoutId = setTimeout(() => {
    timeoutReached = true;
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(
      `${backendApiUrl}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginRequest),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const responseBody = await readJsonResponse(backendResponse);
    const backendMessage = getBackendMessage(responseBody);

    /*
     * Backend actualmente utiliza 401 tanto para credenciales
     * incorrectas como para usuarios inactivos.
     */
    if (backendResponse.status === 401) {
      const credentialError =
        normalizeCredentialError(backendMessage);

      return createErrorResponse(
        credentialError.type,
        credentialError.message,
        401,
      );
    }

    /*
     * 423 es el estado entregado actualmente por backend.
     * 429 es el estado definido por el requisito funcional.
     */
    if (
      backendResponse.status === 423 ||
      backendResponse.status === 429
    ) {
      return createErrorResponse(
        "account_locked",
        "Usuario bloqueado por múltiples intentos fallidos. Contacte al administrador.",
        429,
      );
    }

    if (backendResponse.status === 422) {
      const messages = getBackendMessages(responseBody);

      return createErrorResponse(
        "validation",
        getValidationMessage(responseBody),
        422,
        messages,
      );
    }

    if (backendResponse.status >= 500) {
      return createErrorResponse(
        "server",
        SERVER_MESSAGE,
        500,
      );
    }

    if (!backendResponse.ok) {
      return createErrorResponse(
        "unknown",
        backendMessage ??
          "No se pudo completar el inicio de sesión.",
        backendResponse.status,
      );
    }

    if (
      backendResponse.status !== 200 &&
      backendResponse.status !== 201
    ) {
      return createErrorResponse(
        "server",
        SERVER_MESSAGE,
        500,
      );
    }

    const normalizedResponse =
      normalizeBackendLoginResponse(responseBody);

    if (!normalizedResponse) {
      return createErrorResponse(
        "server",
        "La respuesta del servicio de autenticación no tiene el formato esperado.",
        500,
      );
    }

    /*
     * Guarda el access token en la cookie HttpOnly.
     * El token no queda expuesto a JavaScript del navegador.
     */
    await setAuthToken(normalizedResponse.accessToken);

    /*
     * Al navegador solamente se devuelve la sesión pública.
     * Nunca se devuelve el access token.
     */
    return NextResponse.json(
      normalizedResponse.session,
      { status: 200 },
    );
  } catch (error) {
    if (timeoutReached || isAbortError(error)) {
      return createErrorResponse(
        "timeout",
        TIMEOUT_MESSAGE,
        504,
      );
    }

    return createErrorResponse(
      "network",
      NETWORK_MESSAGE,
      503,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}