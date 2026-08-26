import type {
  z,
} from "zod";

import {
  adminCustomerDetailResponseSchema,
  adminCustomerListResponseSchema,
  adminCustomerOrdersResponseSchema,
} from "@/types/customers";

import type {
  AdminCustomerDetail,
  AdminCustomerListData,
  AdminCustomerOrdersData,
  AdminCustomerOrdersQuery,
  AdminCustomersQuery,
} from "@/types/customers";

interface CustomerApiSuccess<T> {
  success: true;
  data: T;
}

export interface CustomersServiceOptions {
  signal?: AbortSignal;
}

export type GetCustomersQuery =
  AdminCustomersQuery;

export type GetCustomerOrdersPagination =
  AdminCustomerOrdersQuery;

export type CustomersServiceErrorKind =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "serverError"
  | "network"
  | "invalidResponse"
  | "unknown";

export class CustomersServiceRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly kind: CustomersServiceErrorKind,
    message: string,
  ) {
    super(message);
    this.name =
      "CustomersServiceRequestError";
  }
}

const CUSTOMERS_API_URL =
  "/api/customers";
const CUSTOMER_SESSION_RECOVERY_URL =
  "/api/auth/session";

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
  fallback: string,
): string {
  if (!isRecord(body)) {
    return fallback;
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

  return fallback;
}

function getErrorKind(
  status: number,
): CustomersServiceErrorKind {
  if (status === 401) {
    return "unauthorized";
  }

  if (status === 403) {
    return "forbidden";
  }

  if (status === 404) {
    return "notFound";
  }

  if (status >= 500) {
    return "serverError";
  }

  if (status === 0) {
    return "network";
  }

  return "unknown";
}

function getSafeErrorMessage(
  status: number,
  body: unknown,
  fallback: string,
): string {
  const kind =
    getErrorKind(
      status,
    );

  if (kind === "unauthorized") {
    return "No existe una sesion administrativa activa.";
  }

  if (kind === "forbidden") {
    return "Acceso denegado.";
  }

  if (kind === "notFound") {
    return "Cliente no encontrado.";
  }

  if (kind === "serverError") {
    return fallback;
  }

  return getResponseMessage(
    body,
    fallback,
  );
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

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

async function recoverSessionOnce(
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const response =
      await fetch(
        CUSTOMER_SESSION_RECOVERY_URL,
        {
          method:
            "GET",
          credentials:
            "same-origin",
          cache:
            "no-store",
          signal,
        },
      );

    return response.ok;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    return false;
  }
}

async function fetchCustomerApi(
  input: string,
  options: CustomersServiceOptions,
  hasRecoveredSession = false,
): Promise<Response> {
  let response: Response;

  try {
    response =
      await fetch(
        input,
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
          signal:
            options.signal,
        },
      );
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new CustomersServiceRequestError(
      0,
      "network",
      "No fue posible conectar con el servicio de clientes.",
    );
  }

  if (
    response.status === 401 &&
    !hasRecoveredSession
  ) {
    const recoveredSession =
      await recoverSessionOnce(
        options.signal,
      );

    if (recoveredSession) {
      return fetchCustomerApi(
        input,
        options,
        true,
      );
    }
  }

  return response;
}

function setOptionalQueryParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  const normalizedValue =
    value?.trim() ?? "";

  if (normalizedValue) {
    params.set(
      key,
      normalizedValue,
    );
  }
}

function buildCustomersQueryString(
  query: GetCustomersQuery,
): string {
  const params =
    new URLSearchParams();

  if (query.page) {
    params.set(
      "page",
      String(query.page),
    );
  }

  if (query.limit) {
    params.set(
      "limit",
      String(query.limit),
    );
  }

  setOptionalQueryParam(
    params,
    "search",
    query.search,
  );
  setOptionalQueryParam(
    params,
    "lastOrderFrom",
    query.lastOrderFrom,
  );
  setOptionalQueryParam(
    params,
    "lastOrderTo",
    query.lastOrderTo,
  );

  if (query.sortBy) {
    params.set(
      "sortBy",
      query.sortBy,
    );

    if (query.order) {
      params.set(
        "order",
        query.order,
      );
    }
  }

  const queryString =
    params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

function buildCustomerOrdersQueryString(
  pagination: GetCustomerOrdersPagination,
): string {
  const params =
    new URLSearchParams();

  if (pagination.page) {
    params.set(
      "page",
      String(pagination.page),
    );
  }

  if (pagination.limit) {
    params.set(
      "limit",
      String(pagination.limit),
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

async function requestCustomerData<T>(
  input: string,
  responseSchema: z.ZodType<CustomerApiSuccess<T>>,
  invalidResponseMessage: string,
  fallbackErrorMessage: string,
  options: CustomersServiceOptions = {},
): Promise<T> {
  const response =
    await fetchCustomerApi(
      input,
      options,
    );

  const responseBody =
    await readJsonResponse(
      response,
    );

  if (!response.ok) {
    const kind =
      getErrorKind(
        response.status,
      );

    throw new CustomersServiceRequestError(
      response.status,
      kind,
      getSafeErrorMessage(
        response.status,
        responseBody,
        fallbackErrorMessage,
      ),
    );
  }

  const parsedResponse =
    responseSchema.safeParse(
      responseBody,
    );

  if (!parsedResponse.success) {
    throw new CustomersServiceRequestError(
      500,
      "invalidResponse",
      invalidResponseMessage,
    );
  }

  return parsedResponse.data.data;
}

async function getCustomers(
  query: GetCustomersQuery,
  options?: CustomersServiceOptions,
): Promise<AdminCustomerListData> {
  return requestCustomerData(
    `${CUSTOMERS_API_URL}${buildCustomersQueryString(
      query,
    )}`,
    adminCustomerListResponseSchema,
    "La respuesta de clientes no tiene el formato esperado.",
    "No fue posible consultar los clientes.",
    options,
  );
}

async function getCustomer(
  id: string,
  options?: CustomersServiceOptions,
): Promise<AdminCustomerDetail> {
  return requestCustomerData(
    `${CUSTOMERS_API_URL}/${encodeURIComponent(
      id,
    )}`,
    adminCustomerDetailResponseSchema,
    "La respuesta del detalle de cliente no tiene el formato esperado.",
    "No fue posible consultar el detalle del cliente.",
    options,
  );
}

async function getCustomerOrders(
  customerId: string,
  pagination: GetCustomerOrdersPagination,
  options?: CustomersServiceOptions,
): Promise<AdminCustomerOrdersData> {
  return requestCustomerData(
    `${CUSTOMERS_API_URL}/${encodeURIComponent(
      customerId,
    )}/orders${buildCustomerOrdersQueryString(
      pagination,
    )}`,
    adminCustomerOrdersResponseSchema,
    "La respuesta del historial de pedidos no tiene el formato esperado.",
    "No fue posible consultar el historial de pedidos.",
    options,
  );
}

export const customersService = {
  getCustomers,
  getCustomer,
  getCustomerOrders,
};
