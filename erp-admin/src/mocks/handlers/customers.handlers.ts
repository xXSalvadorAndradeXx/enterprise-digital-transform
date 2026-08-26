import {
  http,
  HttpResponse,
} from "msw";

import {
  adminCustomerOrdersQuerySchema,
  adminCustomersQuerySchema,
} from "@/types/customers";

import type {
  AdminCustomerListItem,
  AdminCustomerOrdersResponse,
  AdminCustomerListResponse,
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

import type {
  PageMeta,
} from "@/types/api-contract.types";

import {
  mockAdminCustomerDetails,
  mockAdminCustomerOrders,
  mockAdminCustomers,
} from "../data/customers.mock";

import type {
  MockAdminCustomerOrderHistoryItem,
} from "../data/customers.mock";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_ORDER: SortOrder = "ASC";
const BACKEND_API_URL =
  process.env.BACKEND_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:3000/api/v1";
const ADMIN_CUSTOMERS_ENDPOINT =
  `${BACKEND_API_URL}/admin/customers`;

interface BackendErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

function getPathParam(
  value: string | readonly string[] | undefined,
): string {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0] ?? "";
}

function getOptionalQueryParam(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key);

  return value === null ? undefined : value;
}

function buildApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): BackendErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
}

function hasBearerToken(request: Request): boolean {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  return authorization
    .slice("Bearer ".length)
    .trim()
    .length > 0;
}

function getCustomerSortValue(
  customer: AdminCustomerListItem,
  sortBy: AdminCustomerSortBy,
): string | number | null {
  if (sortBy === "lastOrderAt") {
    return customer.lastOrderAt
      ? Date.parse(customer.lastOrderAt)
      : null;
  }

  if (sortBy === "totalSpent") {
    return Number(customer.totalSpent);
  }

  return customer[sortBy];
}

function compareCustomers(
  firstCustomer: AdminCustomerListItem,
  secondCustomer: AdminCustomerListItem,
  sortBy: AdminCustomerSortBy,
  order: SortOrder,
): number {
  const firstValue =
    getCustomerSortValue(firstCustomer, sortBy);
  const secondValue =
    getCustomerSortValue(secondCustomer, sortBy);
  const direction =
    order === "DESC" ? -1 : 1;

  if (
    firstValue === null ||
    secondValue === null
  ) {
    if (firstValue === secondValue) {
      return 0;
    }

    return firstValue === null
      ? direction
      : -direction;
  }

  if (
    typeof firstValue === "number" &&
    typeof secondValue === "number"
  ) {
    return (firstValue - secondValue) * direction;
  }

  return String(firstValue)
    .localeCompare(String(secondValue)) * direction;
}

function getDateRangeBoundary(
  isoDate: string | undefined,
  endOfDay: boolean,
): number | null {
  if (!isoDate) {
    return null;
  }

  const time =
    endOfDay
      ? "T23:59:59.999Z"
      : "T00:00:00.000Z";

  return Date.parse(`${isoDate}${time}`);
}

function filterCustomers(
  customers: AdminCustomerListItem[],
  options: {
    search?: string;
    lastOrderFrom?: string;
    lastOrderTo?: string;
  },
): AdminCustomerListItem[] {
  const normalizedSearch =
    options.search?.trim().toLowerCase();
  const fromTimestamp =
    getDateRangeBoundary(
      options.lastOrderFrom,
      false,
    );
  const toTimestamp =
    getDateRangeBoundary(
      options.lastOrderTo,
      true,
    );

  return customers.filter((customer) => {
    const matchesSearch =
      !normalizedSearch ||
      customer.fullName
        .toLowerCase()
        .includes(normalizedSearch) ||
      customer.email
        .toLowerCase()
        .includes(normalizedSearch);

    if (!customer.lastOrderAt) {
      return (
        matchesSearch &&
        fromTimestamp === null &&
        toTimestamp === null
      );
    }

    const lastOrderTimestamp =
      Date.parse(customer.lastOrderAt);
    const matchesFrom =
      fromTimestamp === null ||
      lastOrderTimestamp >= fromTimestamp;
    const matchesTo =
      toTimestamp === null ||
      lastOrderTimestamp <= toTimestamp;

    return (
      matchesSearch &&
      matchesFrom &&
      matchesTo
    );
  });
}

function paginateCustomers(
  customers: AdminCustomerListItem[],
  page: number,
  limit: number,
): {
  items: AdminCustomerListItem[];
  meta: PageMeta;
} {
  const total =
    customers.length;
  const totalPages =
    total === 0
      ? 0
      : Math.ceil(total / limit);
  const startIndex =
    (page - 1) * limit;
  const items =
    customers.slice(
      startIndex,
      startIndex + limit,
    );

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage:
        totalPages > 0 && page > 1,
    },
  };
}

function paginateCustomerOrders(
  orders: MockAdminCustomerOrderHistoryItem[],
  page: number,
  limit: number,
): {
  items: MockAdminCustomerOrderHistoryItem[];
  meta: PageMeta;
} {
  const total =
    orders.length;
  const totalPages =
    total === 0
      ? 0
      : Math.ceil(total / limit);
  const startIndex =
    (page - 1) * limit;
  const items =
    orders.slice(
      startIndex,
      startIndex + limit,
    );

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage:
        totalPages > 0 && page > 1,
    },
  };
}

export const customersHandlers = [
  http.get(
    `${ADMIN_CUSTOMERS_ENDPOINT}/:id/orders`,
    ({ params, request }) => {
      if (!hasBearerToken(request)) {
        return HttpResponse.json(
          buildApiError(
            "UNAUTHORIZED",
            "Bearer token requerido.",
          ),
          {
            status: 401,
          },
        );
      }

      const customerId =
        getPathParam(
          params.id,
        );
      const customerExists =
        mockAdminCustomerDetails.some(
          (item) =>
            item.id === customerId,
        );

      if (!customerExists) {
        return HttpResponse.json(
          buildApiError(
            "CUSTOMER_NOT_FOUND",
            "Cliente no encontrado.",
          ),
          {
            status: 404,
          },
        );
      }

      const requestUrl =
        new URL(request.url);
      const parsedQuery =
        adminCustomerOrdersQuerySchema.safeParse({
          page: getOptionalQueryParam(
            requestUrl.searchParams,
            "page",
          ),
          limit: getOptionalQueryParam(
            requestUrl.searchParams,
            "limit",
          ),
        });

      if (!parsedQuery.success) {
        return HttpResponse.json(
          buildApiError(
            "INVALID_CUSTOMER_ORDERS_QUERY",
            "Los parametros de paginacion de pedidos no son validos.",
            {
              issues:
                parsedQuery.error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                })),
            },
          ),
          {
            status: 400,
          },
        );
      }

      const query =
        parsedQuery.data;
      const page =
        query.page ?? DEFAULT_PAGE;
      const limit =
        query.limit ?? DEFAULT_LIMIT;
      const orders =
        mockAdminCustomerOrders[customerId] ?? [];
      const data =
        paginateCustomerOrders(
          orders,
          page,
          limit,
        );
      const response: AdminCustomerOrdersResponse =
        {
          success:
            true,
          data,
        };

      return HttpResponse.json(response);
    },
  ),

  http.get(
    `${ADMIN_CUSTOMERS_ENDPOINT}/:id`,
    ({ params, request }) => {
      if (!hasBearerToken(request)) {
        return HttpResponse.json(
          buildApiError(
            "UNAUTHORIZED",
            "Bearer token requerido.",
          ),
          {
            status: 401,
          },
        );
      }

      const customerId =
        getPathParam(
          params.id,
        );
      const customer =
        mockAdminCustomerDetails.find(
          (item) =>
            item.id === customerId,
        );

      if (!customer) {
        return HttpResponse.json(
          buildApiError(
            "CUSTOMER_NOT_FOUND",
            "Cliente no encontrado.",
          ),
          {
            status: 404,
          },
        );
      }

      return HttpResponse.json({
        success:
          true,
        data:
          customer,
      });
    },
  ),

  http.get(
    ADMIN_CUSTOMERS_ENDPOINT,
    ({ request }) => {
      if (!hasBearerToken(request)) {
        return HttpResponse.json(
          buildApiError(
            "UNAUTHORIZED",
            "Bearer token requerido.",
          ),
          {
            status: 401,
          },
        );
      }

      const requestUrl =
        new URL(request.url);
      const parsedQuery =
        adminCustomersQuerySchema.safeParse({
          search: getOptionalQueryParam(
            requestUrl.searchParams,
            "search",
          ),
          lastOrderFrom: getOptionalQueryParam(
            requestUrl.searchParams,
            "lastOrderFrom",
          ),
          lastOrderTo: getOptionalQueryParam(
            requestUrl.searchParams,
            "lastOrderTo",
          ),
          page: getOptionalQueryParam(
            requestUrl.searchParams,
            "page",
          ),
          limit: getOptionalQueryParam(
            requestUrl.searchParams,
            "limit",
          ),
          sortBy: getOptionalQueryParam(
            requestUrl.searchParams,
            "sortBy",
          ),
          order: getOptionalQueryParam(
            requestUrl.searchParams,
            "order",
          ),
        });

      if (!parsedQuery.success) {
        return HttpResponse.json(
          buildApiError(
            "INVALID_CUSTOMERS_QUERY",
            "Los parametros de busqueda de clientes no son validos.",
            {
              issues:
                parsedQuery.error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                })),
            },
          ),
          {
            status: 400,
          },
        );
      }

      const query =
        parsedQuery.data;
      const page =
        query.page ?? DEFAULT_PAGE;
      const limit =
        query.limit ?? DEFAULT_LIMIT;
      const order =
        query.order ?? DEFAULT_SORT_ORDER;
      const sortBy =
        query.sortBy;
      const filteredCustomers =
        filterCustomers(
          mockAdminCustomers,
          {
            search: query.search,
            lastOrderFrom:
              query.lastOrderFrom,
            lastOrderTo:
              query.lastOrderTo,
          },
        );
      const sortedCustomers =
        sortBy
          ? [...filteredCustomers].sort(
              (
                firstCustomer,
                secondCustomer,
              ) =>
                compareCustomers(
                  firstCustomer,
                  secondCustomer,
                  sortBy,
                  order,
                ),
            )
          : filteredCustomers;
      const data =
        paginateCustomers(
          sortedCustomers,
          page,
          limit,
        );
      const response: AdminCustomerListResponse = {
        success: true,
        data,
      };

      return HttpResponse.json(response);
    },
  ),
];
