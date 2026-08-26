import {
  adminCustomerDetailResponseSchema,
} from "@/types/customers";

import type {
  AdminCustomerDetail,
} from "@/types/customers";

export class AdminCustomerDetailRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name =
      "AdminCustomerDetailRequestError";
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
    return "No fue posible consultar el detalle del cliente.";
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

  return "No fue posible consultar el detalle del cliente.";
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

export async function getAdminCustomerById(
  id: string,
  signal?: AbortSignal,
): Promise<AdminCustomerDetail> {
  const response =
    await fetch(
      `/api/customers/${encodeURIComponent(
        id,
      )}`,
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
    throw new AdminCustomerDetailRequestError(
      response.status,
      getResponseMessage(
        responseBody,
      ),
    );
  }

  const parsedResponse =
    adminCustomerDetailResponseSchema.safeParse(
      responseBody,
    );

  if (!parsedResponse.success) {
    throw new AdminCustomerDetailRequestError(
      500,
      "La respuesta del detalle de cliente no tiene el formato esperado.",
    );
  }

  return parsedResponse.data.data;
}
