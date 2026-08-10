import {
  AuthServiceError,
  type AuthErrorType,
  type AuthUser,
  type LoginRequest,
  type PublicAuthSession,
} from "@/types/auth/auth.types";

const DEFAULT_LOGIN_TIMEOUT_MS = 10_000;

const USER_NOT_REGISTERED_MESSAGE =
  "El usuario no está registrado.";
const INCORRECT_PASSWORD_MESSAGE =
  "La contraseña es incorrecta.";
const INVALID_LOGIN_MESSAGE =
  "Usuario o contraseña incorrectos.";
const USER_INACTIVE_MESSAGE =
  "Usuario inactivo";
const ACCOUNT_LOCKED_MESSAGE =
  "Usuario bloqueado por múltiples intentos fallidos. Contacte al administrador.";
const VALIDATION_MESSAGE =
  "Datos de inicio de sesión inválidos.";
const NETWORK_MESSAGE =
  "No se pudo conectar con el servicio de autenticación.";
const SERVER_MESSAGE =
  "El servicio de autenticación no está disponible.";
const TIMEOUT_MESSAGE =
  "La solicitud de autenticación superó el tiempo de espera.";
const UNAUTHORIZED_MESSAGE =
  "No existe una sesión activa.";
const UNKNOWN_MESSAGE =
  "No se pudo completar la solicitud de autenticación.";

interface LoginOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

const AUTH_ERROR_TYPES = new Set<AuthErrorType>([
  "validation",
  "user_not_registered",
  "incorrect_password",
  "invalid_credentials",
  "user_inactive",
  "account_locked",
  "network",
  "timeout",
  "server",
  "unauthorized",
  "unknown",
]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthErrorType(
  value: unknown,
): value is AuthErrorType {
  return (
    typeof value === "string" &&
    AUTH_ERROR_TYPES.has(value as AuthErrorType)
  );
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.rol === "string" &&
    (
      typeof value.nombre === "undefined" ||
      typeof value.nombre === "string"
    )
  );
}

function isPublicAuthSession(
  value: unknown,
): value is PublicAuthSession {
  return (
    isRecord(value) &&
    isAuthUser(value.user) &&
    value.isAuthenticated === true &&
    typeof value.mustChangePassword === "boolean"
  );
}

function createAbortError(): Error {
  const error = new Error(
    "Solicitud de autenticación cancelada.",
  );

  error.name = "AbortError";

  return error;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
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

function getDefaultErrorType(
  statusCode: number,
): AuthErrorType {
  if (statusCode === 401) {
    return "invalid_credentials";
  }

  /*
   * 423 es el código que backend utiliza actualmente.
   * 429 es el código definido por el requisito funcional.
   */
  if (statusCode === 423 || statusCode === 429) {
    return "account_locked";
  }

  if (statusCode === 422) {
    return "validation";
  }

  if (statusCode === 504) {
    return "timeout";
  }

  if (statusCode >= 500) {
    return "server";
  }

  return "unknown";
}

function getDefaultErrorMessage(
  type: AuthErrorType,
): string {
  switch (type) {
    case "user_not_registered":
      return USER_NOT_REGISTERED_MESSAGE;

    case "incorrect_password":
      return INCORRECT_PASSWORD_MESSAGE;

    case "invalid_credentials":
      return INVALID_LOGIN_MESSAGE;

    case "user_inactive":
      return USER_INACTIVE_MESSAGE;

    case "account_locked":
      return ACCOUNT_LOCKED_MESSAGE;

    case "validation":
      return VALIDATION_MESSAGE;

    case "network":
      return NETWORK_MESSAGE;

    case "timeout":
      return TIMEOUT_MESSAGE;

    case "server":
      return SERVER_MESSAGE;

    case "unauthorized":
      return UNAUTHORIZED_MESSAGE;

    case "unknown":
      return UNKNOWN_MESSAGE;
  }
}

function normalizeBffError(
  statusCode: number,
  body: unknown,
): AuthServiceError {
  const fallbackType = getDefaultErrorType(statusCode);

  /*
   * Si el BFF envía un tipo conocido, se respeta.
   * De lo contrario, se obtiene a partir del código HTTP.
   */
  const type =
    isRecord(body) && isAuthErrorType(body.type)
      ? body.type
      : fallbackType;

  /*
   * El mensaje normalizado por el BFF tiene prioridad.
   * Si no existe, se utiliza el mensaje seguro por defecto.
   */
  const message =
    isRecord(body) &&
    typeof body.message === "string" &&
    body.message.trim().length > 0
      ? body.message
      : getDefaultErrorMessage(type);

  return new AuthServiceError(
    type,
    message,
    statusCode,
  );
}

export async function login(
  request: LoginRequest,
  options: LoginOptions = {},
): Promise<PublicAuthSession> {
  const controller = new AbortController();

  const timeoutMs =
    options.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS;

  let timeoutReached = false;
  let externalAbort = false;

  /*
   * Si el componente ya canceló la operación,
   * no se inicia una nueva solicitud.
   */
  if (options.signal?.aborted) {
    throw createAbortError();
  }

  const handleExternalAbort = (): void => {
    externalAbort = true;
    controller.abort();
  };

  options.signal?.addEventListener(
    "abort",
    handleExternalAbort,
    { once: true },
  );

  const timeoutId = setTimeout(() => {
    timeoutReached = true;
    controller.abort();
  }, timeoutMs);

  try {
    /*
     * El navegador llama al Route Handler de Next.js.
     * No llama directamente al backend de NestJS.
     */
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const responseBody =
      await readJsonResponse(response);

    if (!response.ok) {
      throw normalizeBffError(
        response.status,
        responseBody,
      );
    }

    /*
     * Aunque HTTP sea 200, se valida que la respuesta
     * tenga la estructura de una sesión pública.
     */
    if (!isPublicAuthSession(responseBody)) {
      throw new AuthServiceError(
        "server",
        SERVER_MESSAGE,
        response.status,
      );
    }

    return responseBody;
  } catch (error) {
    if (timeoutReached) {
      throw new AuthServiceError(
        "timeout",
        TIMEOUT_MESSAGE,
        504,
      );
    }

    /*
     * Una cancelación por desmontaje del componente
     * no se presenta como error de red.
     */
    if (
      externalAbort ||
      options.signal?.aborted ||
      isAbortError(error)
    ) {
      throw createAbortError();
    }

    /*
     * Conserva los errores que ya fueron
     * normalizados por este servicio.
     */
    if (error instanceof AuthServiceError) {
      throw error;
    }

    /*
     * fetch lanza una excepción cuando no puede
     * establecer comunicación con el BFF.
     */
    throw new AuthServiceError(
      "network",
      NETWORK_MESSAGE,
      503,
    );
  } finally {
    clearTimeout(timeoutId);

    options.signal?.removeEventListener(
      "abort",
      handleExternalAbort,
    );
  }
}
