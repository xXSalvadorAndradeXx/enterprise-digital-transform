import {
  adminCustomerOrdersResponseSchema,
} from "@/types/customers";

import type {
  AdminCustomerOrdersData,
} from "@/types/customers";

export interface GetAdminCustomerOrdersParams {
  customerId: string;
  page: number;
  limit: number;
}

export class AdminCustomerOrdersRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminCustomerOrdersRequestError";
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMessageText(
  value: unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string",
      )
      .join(" ");
  }

  return "";
}

function getResponseMessage(
  body: unknown,
): string {
  if (!isRecord(body)) {
    return "No fue posible consultar el historial de pedidos.";
  }

  const rootMessage =
    getMessageText(
      body.message,
    );

  if (rootMessage) {
    return rootMessage;
  }

  if (isRecord(body.error)) {
    const errorMessage =
      getMessageText(
        body.error.message,
      );

    if (errorMessage) {
      return errorMessage;
    }
  }

  return "No fue posible consultar el historial de pedidos.";
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

export async function getAdminCustomerOrders(
  {
    customerId,
    page,
    limit,
  }: GetAdminCustomerOrdersParams,
  signal?: AbortSignal,
): Promise<AdminCustomerOrdersData> {
  const params =
    new URLSearchParams({
      page:
        String(page),
      limit:
        String(limit),
    });

  const response =
    await fetch(
      `/api/customers/${encodeURIComponent(
        customerId,
      )}/orders?${params.toString()}`,
      {
        method:
          "GET",
        credentials:
          "same-origin",
        headers: {
          Accept:
            "application/json",
        },
        cache:
          "no-store",
        signal,
      },
    );

  const responseBody =
    await readJsonResponse(
      response,
    );

  if (!response.ok) {
    throw new AdminCustomerOrdersRequestError(
      response.status,
      getResponseMessage(
        responseBody,
      ),
    );
  }

  const parsedResponse =
    adminCustomerOrdersResponseSchema.safeParse(
      responseBody,
    );

  if (!parsedResponse.success) {
    throw new AdminCustomerOrdersRequestError(
      500,
      "La respuesta del historial de pedidos no tiene el formato esperado.",
    );
  }

  return parsedResponse.data.data;
}
