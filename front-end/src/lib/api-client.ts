const API_BASE_URL = "http://localhost:3000/api/v1";

const ACCESS_TOKEN_STORAGE_KEY = "access_token";
let refreshRequest: Promise<string | null> | null = null;

type ApiRequestOptions<TBody> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
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

async function readJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  if (!response.headers.get("content-type")?.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readStoredAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function isJwtExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now() + 10_000;
  } catch {
    return true;
  }
}

function extractRefreshedAccessToken(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== "object") return null;

  const record = responseData as { data?: unknown; accessToken?: unknown };
  if (typeof record.accessToken === "string") return record.accessToken;
  return extractRefreshedAccessToken(record.data);
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ecommerce/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const responseData = await readJsonResponse(response);
      const token = response.ok
        ? extractRefreshedAccessToken(responseData)
        : null;

      if (token) {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
        window.dispatchEvent(new Event("auth-session-changed"));
        return token;
      }

      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-session-changed"));
      return null;
    } catch {
      return null;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

async function ensureFreshAuthorization(
  path: string,
  headers: HeadersInit | undefined,
): Promise<HeadersInit | undefined> {
  if (path.startsWith("/ecommerce/auth/")) return headers;

  const token = readStoredAccessToken();
  if (!token || !isJwtExpired(token)) return headers;

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${refreshedToken}`,
  };
}

async function executeRequest<TResponse, TBody>(
  path: string,
  options: ApiRequestOptions<TBody>,
): Promise<{ data: TResponse; response: Response }> {
  const { method = "GET", body, headers, signal } = options;

  try {
    const requestHeaders = await ensureFreshAuthorization(path, headers);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...requestHeaders },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    const responseData = await readJsonResponse(response);
    if (!response.ok) {
      throw new ApiRequestError(
        getErrorMessage(responseData, "No se pudo completar la solicitud."),
        response.status,
        responseData,
        getErrorCode(responseData),
      );
    }

    return { data: responseData as TResponse, response };
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError("No se pudo conectar con el servidor.", 0, null, null);
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
