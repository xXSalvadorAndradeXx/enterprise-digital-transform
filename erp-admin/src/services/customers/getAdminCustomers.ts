import {
  adminCustomerListResponseSchema,
} from "@/types/customers";

import type {
  AdminCustomerListData,
} from "@/types/customers";

export interface GetAdminCustomersParams {
  page: number;
  limit: number;
}

export class AdminCustomersRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminCustomersRequestError";
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

  return "No fue posible consultar los clientes.";
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

export async function getAdminCustomers({
  page,
  limit,
}: GetAdminCustomersParams,
signal?: AbortSignal): Promise<AdminCustomerListData> {
  const params =
    new URLSearchParams({
      page:
        String(page),
      limit:
        String(limit),
    });

  const response =
    await fetch(
      `/api/customers?${params.toString()}`,
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
    throw new AdminCustomersRequestError(
      response.status,
      getResponseMessage(
        responseBody,
      ),
    );
  }

  const parsedResponse =
    adminCustomerListResponseSchema.safeParse(
      responseBody,
    );

  if (!parsedResponse.success) {
    throw new AdminCustomersRequestError(
      500,
      "La respuesta de clientes no tiene el formato esperado.",
    );
  }

  return parsedResponse.data.data;
}
