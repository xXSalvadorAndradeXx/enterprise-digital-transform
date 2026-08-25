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

function getResponseMessage(
  body: unknown,
): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body
  ) {
    const message =
      body.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .join(" ");
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
