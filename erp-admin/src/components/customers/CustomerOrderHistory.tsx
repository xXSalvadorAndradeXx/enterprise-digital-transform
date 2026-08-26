"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Pagination,
} from "@/components/ui/Pagination";

import {
  customersService,
} from "@/services/customers/customers.service";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

import type {
  PageMeta,
} from "@/types/api-contract.types";

import type {
  AdminCustomerOrderHistoryItem,
  OrderStatus,
} from "@/types/customers";

const ORDERS_PAGE_SIZE = 10;

const EMPTY_ORDERS_META: PageMeta = {
  page:
    1,
  limit:
    ORDERS_PAGE_SIZE,
  total:
    0,
  totalPages:
    0,
  hasNextPage:
    false,
  hasPreviousPage:
    false,
};

const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  string
> = {
  NEW:
    "Nuevo",
  PENDING:
    "Pendiente",
  ON_ROUTE:
    "En ruta",
  READY_FOR_PICKUP:
    "Listo para retiro",
  DELIVERED:
    "Entregado",
  CANCELLED:
    "Cancelado",
};

const ORDER_STATUS_CLASSES: Record<
  OrderStatus,
  string
> = {
  NEW:
    "bg-blue-100 text-blue-700",
  PENDING:
    "bg-amber-100 text-amber-700",
  ON_ROUTE:
    "bg-indigo-100 text-indigo-700",
  READY_FOR_PICKUP:
    "bg-cyan-100 text-cyan-700",
  DELIVERED:
    "bg-green-100 text-green-700",
  CANCELLED:
    "bg-red-100 text-red-700",
};

interface CustomerOrderHistoryProps {
  customerId: string;
  initialPage: number;
  returnHref: string;
}

interface CustomerOrderStatusBadgeProps {
  status: OrderStatus;
}

function buildCustomerDetailHref(
  pathname: string,
  returnHref: string,
  ordersPage: number,
): string {
  const params =
    new URLSearchParams({
      returnTo:
        returnHref,
    });

  if (ordersPage > 1) {
    params.set(
      "ordersPage",
      String(ordersPage),
    );
  }

  return `${pathname}?${params.toString()}`;
}

function formatOrderDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "es-SV",
    {
      dateStyle:
        "medium",
    },
  ).format(
    new Date(value),
  );
}

function formatOrderTotal(
  value: string,
): string {
  return formatCurrency(
    Number(value),
  );
}

function CustomerOrderStatusBadge({
  status,
}: CustomerOrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_CLASSES[status]}`}
    >
      {
        ORDER_STATUS_LABELS[
          status
        ]
      }
    </span>
  );
}

export function CustomerOrderHistory({
  customerId,
  initialPage,
  returnHref,
}: CustomerOrderHistoryProps) {
  const router =
    useRouter();
  const pathname =
    usePathname();
  const [
    page,
    setPage,
  ] = useState(initialPage);
  const [
    orders,
    setOrders,
  ] =
    useState<
      AdminCustomerOrderHistoryItem[]
    >([]);
  const [
    meta,
    setMeta,
  ] = useState<PageMeta>(
    EMPTY_ORDERS_META,
  );
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState("");

  const currentDetailHref =
    buildCustomerDetailHref(
      pathname,
      returnHref,
      page,
    );

  useEffect(() => {
    router.replace(
      currentDetailHref,
      {
        scroll:
          false,
      },
    );
  }, [
    currentDetailHref,
    router,
  ]);

  useEffect(() => {
    const controller =
      new AbortController();

    setIsLoading(
      true,
    );
    setError(
      "",
    );

    void customersService.getCustomerOrders(
      customerId,
      {
        page,
        limit:
          ORDERS_PAGE_SIZE,
      },
      {
        signal:
          controller.signal,
      },
    )
      .then((response) => {
        setOrders(
          response.items,
        );
        setMeta(
          response.meta,
        );

        if (
          response.meta.totalPages > 0 &&
          page > response.meta.totalPages
        ) {
          setPage(
            response.meta.totalPages,
          );
        }
      })
      .catch((caughtError) => {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setOrders(
          [],
        );
        setMeta({
          ...EMPTY_ORDERS_META,
          page,
        });
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el historial de pedidos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(
            false,
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    customerId,
    page,
  ]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-950">
        Historial de pedidos
      </h2>

      {isLoading ? (
        <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-6">
          <p className="text-sm text-gray-500">
            Cargando pedidos...
          </p>
        </div>
      ) : error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {
              error
            }
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            No hay pedidos registrados.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Numero
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={
                      order.id
                    }
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-950">
                      {
                        order.orderNumber
                      }
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {formatOrderDate(
                        order.createdAt,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {formatOrderTotal(
                        order.total,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      <CustomerOrderStatusBadge
                        status={
                          order.status
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-2 border-t border-gray-100">
              <Pagination
                currentPage={
                  meta.page
                }
                totalPages={
                  meta.totalPages
                }
                onPageChange={
                  setPage
                }
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
