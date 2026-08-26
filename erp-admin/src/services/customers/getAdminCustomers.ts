import {
  adminCustomerListResponseSchema,
} from "@/types/customers";

import type {
  AdminCustomerListData,
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

export interface GetAdminCustomersParams {
  page: number;
  limit: number;
  search?: string;
  lastOrderFrom?: string;
  lastOrderTo?: string;
  sortBy?: AdminCustomerSortBy;
  order?: SortOrder;
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
    return "No fue posible consultar los clientes.";
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

function setOptionalQueryParam(
  params: URLSearchParams,
  key: string,
  value: string,
): void {
  const normalizedValue =
    value.trim();

  if (normalizedValue) {
    params.set(
      key,
      normalizedValue,
    );
  }
}

export async function getAdminCustomers({
  page,
  limit,
  search = "",
  lastOrderFrom = "",
  lastOrderTo = "",
  sortBy,
  order,
}: GetAdminCustomersParams,
signal?: AbortSignal): Promise<AdminCustomerListData> {
  const params =
    new URLSearchParams({
      page:
        String(page),
      limit:
        String(limit),
    });

  setOptionalQueryParam(
    params,
    "search",
    search,
  );
  setOptionalQueryParam(
    params,
    "lastOrderFrom",
    lastOrderFrom,
  );
  setOptionalQueryParam(
    params,
    "lastOrderTo",
    lastOrderTo,
  );

  if (sortBy) {
    params.set(
      "sortBy",
      sortBy,
    );

    if (order) {
      params.set(
        "order",
        order,
      );
    }
  }

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
