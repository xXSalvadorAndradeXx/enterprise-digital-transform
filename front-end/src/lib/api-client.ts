const API_BASE_URL = "http://localhost:3000";

type ApiRequestOptions<TBody> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: HeadersInit;
};

export class ApiRequestError extends Error {
  status: number;
  response: unknown;

  constructor(
    message: string,
    status: number,
    response: unknown,
  ) {
    super(message);

    this.name = "ApiRequestError";
    this.status = status;
    this.response = response;
  }
}

function getErrorMessage(
  responseData: unknown,
  fallbackMessage: string,
) {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "message" in responseData
  ) {
    const message = (
      responseData as {
        message?: unknown;
      }
    ).message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return fallbackMessage;
}

async function readJsonResponse(
  response: Response,
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function executeRequest<TResponse, TBody>(
  path: string,
  options: ApiRequestOptions<TBody>,
): Promise<{
  data: TResponse;
  response: Response;
}> {
  const {
    method = "GET",
    body,
    headers,
  } = options;

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,

        headers: {
          "Content-Type": "application/json",
          ...headers,
        },

        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      },
    );

    const responseData: unknown =
      await readJsonResponse(response);

    if (!response.ok) {
      throw new ApiRequestError(
        getErrorMessage(
          responseData,
          "No se pudo completar la solicitud.",
        ),
        response.status,
        responseData,
      );
    }

    return {
      data: responseData as TResponse,
      response,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      "No se pudo conectar con el servidor.",
      0,
      null,
    );
  }
}

/*
 * Uso normal.
 *
 * Mantiene el mismo comportamiento que ya tenía
 * apiRequest para no afectar los servicios existentes.
 */
export async function apiRequest<
  TResponse,
  TBody = undefined,
>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const result = await executeRequest<
    TResponse,
    TBody
  >(path, options);

  return result.data;
}

/*
 * Uso cuando además del JSON necesitamos consultar
 * información de la respuesta HTTP, por ejemplo headers.
 */
export async function apiRequestWithResponse<
  TResponse,
  TBody = undefined,
>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<{
  data: TResponse;
  response: Response;
}> {
  return executeRequest<TResponse, TBody>(
    path,
    options,
  );
}