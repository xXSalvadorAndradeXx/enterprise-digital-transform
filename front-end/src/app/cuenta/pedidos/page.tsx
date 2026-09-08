"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  hasActiveSession,
  readSessionUser,
} from "@/lib/auth-session";
import useOrders from "@/hooks/orders/useOrders";

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: "Nuevo",
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    PROCESSING: "En preparación",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    CANCELED: "Cancelado",
    FAILED: "Fallido",
    COMPLETED: "Completado",
  };

  return labels[status] ?? status;
}

function getStatusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "FAILED"
  ) {
    return "bg-red-50 text-red-500";
  }

  if (
    normalized === "DELIVERED" ||
    normalized === "COMPLETED"
  ) {
    return "bg-green-50 text-green-600";
  }

  if (
    normalized === "SHIPPED" ||
    normalized === "PROCESSING"
  ) {
    return "bg-blue-50 text-blue-600";
  }

  return "bg-slate-100 text-slate-600";
}

function getPaymentMethodLabel(method: string) {
  if (!method) return method;

  const labels: Record<string, string> = {
    CARD: "Tarjeta de crédito/débito",
    CREDIT_CARD: "Tarjeta de crédito/débito",
    DEBIT_CARD: "Tarjeta de crédito/débito",
    CASH: "Efectivo",
    CASH_ON_DELIVERY: "Pago contra entrega",
    TRANSFER: "Transferencia bancaria",
    BANK_TRANSFER: "Transferencia bancaria",
    PAYPAL: "PayPal",
  };

  return labels[method.toUpperCase()] ?? method;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
    >
      {children}
    </span>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Icon className={className}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    </Icon>
  );
}

export default function PedidosPage() {
  const router = useRouter();

  const {
    orders,
    meta,
    isLoading,
    error,
    retry,
    setPage,
  } = useOrders();

  useEffect(() => {
    if (!hasActiveSession()) {
      router.replace("/login");
    }
  }, [router]);

  const user = readSessionUser();

  if (!hasActiveSession()) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-10rem)] bg-white">
      <div className="mx-auto flex w-full max-w-[1180px] gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden w-[210px] shrink-0 lg:block">
          <nav className="space-y-2">

            <button
              type="button"
              onClick={() => router.push("/cuenta")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Icon>
              Cuenta
            </button>

            <button
              type="button"
              className="relative flex w-full items-center gap-3 rounded-lg bg-[#f1f4fb] px-4 py-3 text-left text-sm font-semibold text-gray-900"
            >
              <span className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-blue-300" />

              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M3 5h2l2.5 11h10l2-8H6" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                </svg>
              </Icon>

              Pedidos
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M20.8 8.7c0 5-8.8 10.3-8.8 10.3S3.2 13.7 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z" />
                </svg>
              </Icon>
              Favoritos
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <path d="M7 6V4h10v2" />
                  <path d="M3 11h18" />
                </svg>
              </Icon>
              Direcciones
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                  <path d="M10 21h4" />
                </svg>
              </Icon>
              Notificaciones
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <Icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M20 4v16" />
                </svg>
              </Icon>
              Cerrar sesión
            </button>

          </nav>
        </aside>

        {/* CONTENIDO */}
        <section className="min-w-0 flex-1">

          {/* NAVEGACIÓN MÓVIL */}
          <div className="mb-6 overflow-x-auto lg:hidden">
            <div className="flex min-w-max gap-2 border-b border-slate-100 pb-3">

              <button
                type="button"
                onClick={() => router.push("/cuenta")}
                className="rounded-lg px-4 py-2 text-sm text-gray-500"
              >
                Cuenta
              </button>

              <button
                type="button"
                className="rounded-lg bg-[#f1f4fb] px-4 py-2 text-sm font-semibold text-gray-900"
              >
                Pedidos
              </button>

              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-gray-500"
              >
                Favoritos
              </button>

              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-gray-500"
              >
                Direcciones
              </button>

            </div>
          </div>

          {/* LOADING */}
          {isLoading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-gray-700" />
                Consultando tus pedidos...
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && !isLoading && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6">
              <p className="font-semibold text-red-600">
                No fue posible cargar tus pedidos.
              </p>

              <p className="mt-2 text-sm text-red-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void retry()}
                className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* SIN PEDIDOS */}
          {!isLoading && !error && orders.length === 0 && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-slate-200 px-6 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 7h16v12H4z" />
                  <path d="M4 7l2-4h12l2 4" />
                  <path d="M8 11h8" />
                </svg>
              </div>

              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                Aún no tienes pedidos
              </h2>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                Cuando realices una compra, tus pedidos aparecerán aquí.
              </p>
            </div>
          )}

          {/* PEDIDOS */}
          {!isLoading && !error && orders.length > 0 && (
            <div className="space-y-5">

              {orders.map((order) => (
                <article
                  key={order.orderNumber}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >

                  {/* CABECERA */}
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">

                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M6 3h9l3 3v15H6z" />
                            <path d="M15 3v4h4" />
                            <path d="M9 12h6M9 16h6" />
                          </svg>
                        </Icon>

                        {order.orderNumber}
                      </div>

                      <span className="text-gray-300">•</span>

                      <div className="flex items-center gap-2 text-gray-500">
                        <Icon className="h-4 w-4">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="17"
                              rx="2"
                            />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                        </Icon>

                        {formatDate(order.createdAt)}
                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-md px-3 py-1 text-xs font-medium ${getStatusClasses(
                        order.status,
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                  </div>

                  {/* PRODUCTOS */}
                  <div className="divide-y divide-slate-100">

                    {order.items.map((item, index) => (
                      <div
                        key={`${order.orderNumber}-${item.productId ?? "item"}-${index}`}
                        className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:px-6"
                      >

                        {/* IMAGEN */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-[88px] sm:w-[88px]">

                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.commercialName || "Producto"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="16"
                                  rx="2"
                                />
                                <circle cx="8.5" cy="9" r="1.5" />
                                <path d="m21 15-5-5L5 20" />
                              </svg>
                            </div>
                          )}

                        </div>

                        {/* INFORMACIÓN + PRECIO */}
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h3 className="text-sm font-medium text-gray-900 sm:text-[15px]">
                              {item.commercialName || "Producto"}
                            </h3>

                            {item.productId && (
                              <p className="mt-1 truncate text-xs text-gray-400">
                                ID: {item.productId}
                              </p>
                            )}

                            <p className="mt-2 text-sm text-gray-500">
                              x{item.quantity}
                            </p>

                          </div>

                        

                        </div>

                      </div>
                    ))}

                  </div>

                  {/* TOTAL */}
                  <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-6">

                    <span className="text-sm font-medium text-gray-700">
                      Total
                    </span>

                    <span className="text-base font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </span>

                  </div>

                  {/* PIE */}
                  <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <div className="flex flex-col gap-2">

                      <div className="flex items-center gap-2 text-sm text-gray-700">

                        <Icon className="h-4 w-4">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <rect
                              x="3"
                              y="5"
                              width="18"
                              height="14"
                              rx="2"
                            />
                            <path d="M3 10h18" />
                          </svg>
                        </Icon>

                        {getPaymentMethodLabel(order.paymentMethod)}

                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        {getStatusLabel(order.status)}
                        <span className="mx-0.5 text-gray-300">•</span>
                        <ClockIcon />
                        {formatDate(order.createdAt)}
                      </div>

                    </div>

                    <button
                      type="button"
                      className="w-full rounded-md border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 sm:w-auto"
                    >
                      Volver a comprar
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

          {/* PAGINACIÓN */}
          {!isLoading && !error && meta && meta.totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">

              <p className="text-sm text-gray-500">
                Página {meta.page} de {meta.totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() => setPage(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => setPage(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-md border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>

              </div>

            </div>
          )}

        </section>
      </div>
    </main>
  );
}