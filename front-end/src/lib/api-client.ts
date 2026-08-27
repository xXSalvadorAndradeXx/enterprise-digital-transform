const API_BASE_URL = "http://localhost:3000/api/v1";

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

async function executeRequest<TResponse, TBody>(
  path: string,
  options: ApiRequestOptions<TBody>,
): Promise<{ data: TResponse; response: Response }> {
  const { method = "GET", body, headers, signal } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
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
