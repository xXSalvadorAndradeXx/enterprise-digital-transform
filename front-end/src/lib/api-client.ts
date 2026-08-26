const API_BASE_URL = "http://localhost:3000";

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

  constructor(
    message: string,
    status: number,
    response: unknown,
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

function parseApiError(responseData: unknown) {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "success" in responseData &&
    responseData.success === false &&
    "error" in responseData
  ) {
    const error = (responseData as { error?: unknown }).error;

    if (typeof error === "object" && error !== null) {
      const code = "code" in error ? error.code : null;
      const message = "message" in error ? error.message : null;

      return {
        code: typeof code === "string" && code.length > 0 ? code : null,
        message:
          typeof message === "string" && message.length > 0 ? message : null,
      };
    }
  }

  return { code: null, message: null };
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<TResponse, TBody = undefined>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
) {
  const { method = "GET", body, headers, signal } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    const responseData: unknown = await readJsonResponse(response);

    if (!response.ok) {
      const apiError = parseApiError(responseData);

      throw new ApiRequestError(
        apiError.message ?? "No se pudo completar la solicitud.",
        response.status,
        responseData,
        apiError.code,
      );
    }

    return responseData as TResponse;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      "No se pudo conectar con el servidor.",
      0,
      null,
      null,
    );
  }
}
