import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  readAccessToken,
  saveRefreshedAccessToken,
} from "@/lib/auth-session";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface RefreshRequest {
  accessToken: string;
  controller: AbortController;
  promise: Promise<RefreshResult>;
}

type RefreshResult =
  | { status: "refreshed"; accessToken: string }
  | { status: "session-invalid" }
  | { status: "failed"; error: ApiRequestError }
  | { status: "superseded" };

interface CompletedRefresh {
  accessToken: string;
  version: number;
  result: RefreshResult;
}

let refreshRequest: RefreshRequest | null = null;
let refreshCompletionVersion = 0;
let latestCompletedRefresh: CompletedRefresh | null = null;

const SESSION_RECOVERY_ERROR_CODES = new Set([
  "TOKEN_EXPIRED",
  "UNAUTHORIZED",
]);
const TERMINAL_SESSION_ERROR_CODES = new Set([
  "ACCOUNT_DISABLED",
  "SESSION_EXPIRED_OR_REVOKED",
]);
const AUTH_RECOVERY_EXCLUDED_PATHS = new Set([
  "/ecommerce/auth/register",
  "/ecommerce/auth/login",
  "/ecommerce/auth/refresh",
  "/ecommerce/auth/logout",
]);

type ApiRequestOptions<TBody> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  cache?: RequestCache;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export class ApiRequestError extends Error {
  status: number;
  code: string | null;
  response: unknown;

  constructor(message: string, status: number, response: unknown, code: string | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

function getErrorMessage(responseData: unknown, fallbackMessage: string) {
  if (typeof responseData !== "object" || responseData === null) return fallbackMessage;

  const message = (responseData as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;

  const nestedError = (responseData as { error?: unknown }).error;
  if (typeof nestedError === "object" && nestedError !== null) {
    const nestedMessage = (nestedError as { message?: unknown }).message;
    if (typeof nestedMessage === "string") return nestedMessage;
  }

  return fallbackMessage;
}

function getErrorCode(responseData: unknown): string | null {
  if (typeof responseData !== "object" || responseData === null) return null;
  const error = (responseData as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.length > 0 ? code : null;
}

function createResponseError(response: Response, responseData: unknown) {
  return new ApiRequestError(
    getErrorMessage(responseData, "No se pudo completar la solicitud."),
    response.status,
    responseData,
    getErrorCode(responseData),
  );
}

function createNetworkError() {
  return new ApiRequestError(
    "No se pudo conectar con el servidor.",
    0,
    null,
    null,
  );
}

function createSessionEndedError(response: unknown = null) {
  return new ApiRequestError(
    "La sesión ya no está activa.",
    401,
    response,
    "SESSION_ENDED",
  );
}

async function readJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  if (!response.headers.get("content-type")?.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractRefreshedAccessToken(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== "object") return null;

  const record = responseData as { data?: unknown; accessToken?: unknown };
  if (typeof record.accessToken === "string") return record.accessToken;
  return extractRefreshedAccessToken(record.data);
}

function readBearerAccessToken(headers: HeadersInit | undefined): string | null {
  const authorization = new Headers(headers).get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function withBearerAccessToken(
  headers: HeadersInit | undefined,
  accessToken: string,
): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  return nextHeaders;
}

function createRequestHeaders(headers: HeadersInit | undefined): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");
  return requestHeaders;
}

function isSessionRecoveryError(error: ApiRequestError) {
  return (
    error.status === 401 &&
    error.code !== null &&
    SESSION_RECOVERY_ERROR_CODES.has(error.code)
  );
}

function isTerminalSessionError(error: ApiRequestError) {
  return (
    error.status === 401 &&
    error.code !== null &&
    TERMINAL_SESSION_ERROR_CODES.has(error.code)
  );
}

function canRecoverSession(path: string, error: ApiRequestError) {
  return (
    !AUTH_RECOVERY_EXCLUDED_PATHS.has(path.split("?", 1)[0]) &&
    isSessionRecoveryError(error)
  );
}

function refreshAccessToken(accessToken: string): Promise<RefreshResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({ status: "superseded" });
  }

  if (refreshRequest?.accessToken === accessToken) {
    return refreshRequest.promise;
  }

  refreshRequest?.controller.abort();

  const controller = new AbortController();
  let isSavingRefreshedToken = false;
  const abortIfSessionChanged = () => {
    if (!isSavingRefreshedToken && readAccessToken() !== accessToken) {
      controller.abort();
    }
  };

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, abortIfSessionChanged);
  window.addEventListener("storage", abortIfSessionChanged);

  const promise = (async (): Promise<RefreshResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ecommerce/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const responseData = await readJsonResponse(response);

      if (!response.ok) {
        const error = createResponseError(response, responseData);

        if (isTerminalSessionError(error)) {
          clearAuthSession(accessToken);
          return { status: "session-invalid" };
        }

        return { status: "failed", error };
      }

      const token = extractRefreshedAccessToken(responseData);

      if (token) {
        let tokenWasSaved = false;

        isSavingRefreshedToken = true;
        try {
          tokenWasSaved = saveRefreshedAccessToken(token, accessToken);
        } finally {
          isSavingRefreshedToken = false;
        }

        if (!tokenWasSaved) {
          return { status: "superseded" };
        }

        return { status: "refreshed", accessToken: token };
      }

      return {
        status: "failed",
        error: new ApiRequestError(
          "El servidor no devolvió un access token válido.",
          response.status,
          responseData,
          null,
        ),
      };
    } catch {
      if (readAccessToken() !== accessToken) {
        return { status: "superseded" };
      }

      return { status: "failed", error: createNetworkError() };
    } finally {
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        abortIfSessionChanged,
      );
      window.removeEventListener("storage", abortIfSessionChanged);

      if (refreshRequest?.controller === controller) {
        refreshRequest = null;
      }
    }
  })().then((result) => {
    refreshCompletionVersion += 1;
    latestCompletedRefresh = {
      accessToken,
      version: refreshCompletionVersion,
      result,
    };
    return result;
  });

  refreshRequest = { accessToken, controller, promise };

  return promise;
}

async function executeRequest<TResponse, TBody>(
  path: string,
  options: ApiRequestOptions<TBody>,
): Promise<{ data: TResponse; response: Response }> {
  const { method = "GET", body, cache, headers, signal } = options;

  try {
    if (path.split("?", 1)[0] === "/ecommerce/auth/logout") {
      refreshRequest?.controller.abort();
    }

    const requestBody =
      body === undefined ? undefined : JSON.stringify(body);
    const refreshVersionAtRequestStart = refreshCompletionVersion;
    let requestHeaders = createRequestHeaders(headers);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        headers: requestHeaders,
        body: requestBody,
        cache,
        signal,
      });

      const responseData = await readJsonResponse(response);
      if (response.ok) {
        return { data: responseData as TResponse, response };
      }

      const responseError = createResponseError(response, responseData);
      const requestAccessToken = readBearerAccessToken(requestHeaders);

      if (isTerminalSessionError(responseError) && requestAccessToken) {
        clearAuthSession(requestAccessToken);
        throw createSessionEndedError(responseData);
      }

      if (
        attempt === 1 ||
        !requestAccessToken ||
        !canRecoverSession(path, responseError) ||
        signal?.aborted
      ) {
        if (
          attempt === 1 &&
          requestAccessToken &&
          isSessionRecoveryError(responseError)
        ) {
          clearAuthSession(requestAccessToken);
          throw createSessionEndedError(responseData);
        }

        throw responseError;
      }

      const currentAccessToken = readAccessToken();
      let refreshResult: RefreshResult;

      if (
        latestCompletedRefresh?.accessToken === requestAccessToken &&
        latestCompletedRefresh.version > refreshVersionAtRequestStart
      ) {
        refreshResult = latestCompletedRefresh.result;
      } else if (currentAccessToken === requestAccessToken) {
        refreshResult = await refreshAccessToken(requestAccessToken);
      } else {
        throw responseError;
      }

      if (refreshResult.status === "session-invalid") {
        throw createSessionEndedError(responseData);
      }

      if (refreshResult.status === "failed") {
        throw refreshResult.error;
      }

      if (
        refreshResult.status === "superseded" ||
        signal?.aborted ||
        readAccessToken() !== refreshResult.accessToken
      ) {
        throw responseError;
      }

      requestHeaders = withBearerAccessToken(
        requestHeaders,
        refreshResult.accessToken,
      );
    }

    throw createNetworkError();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw createNetworkError();
  }
}

export async function apiRequest<TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const result = await executeRequest<TResponse, TBody>(path, options);
  return result.data;
}

export async function apiRequestWithResponse<TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<{ data: TResponse; response: Response }> {
  return executeRequest<TResponse, TBody>(path, options);
}
