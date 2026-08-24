import {
  z,
} from "zod";

import {
  adminCustomerListItemSchema,
  isoUtcDateTimeSchema,
} from "@/types/customers";

export const provisionalAdminCustomerDetailSchema =
  adminCustomerListItemSchema.extend({
    phone:
      z.string(),
  });

const provisionalAdminCustomerDetailResponseSchema =
  z.object({
    success:
      z.literal(true),
    message:
      z.string(),
    data:
      provisionalAdminCustomerDetailSchema,
    timestamp:
      isoUtcDateTimeSchema,
  });

export type ProvisionalAdminCustomerDetail =
  z.infer<
    typeof provisionalAdminCustomerDetailSchema
  >;

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
): Promise<ProvisionalAdminCustomerDetail> {
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
    provisionalAdminCustomerDetailResponseSchema.safeParse(
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
