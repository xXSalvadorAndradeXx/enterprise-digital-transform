"use client";

import Link from "next/link";
import {
  Bell,
  Heart,
  Package,
  User,
  Heart as HeartIcon,
  MapPin,
  LogOut,
  ShoppingCart,
  Tag,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useNotifications } from "@/hooks/notifications/useNotifications";
import type {
  Notification,
  NotificationType,
} from "@/types/notifications/notification.types";

type NotificationTab = "all" | "orders" | "offers";

const notificationTypeByTab: Record<
  NotificationTab,
  NotificationType | undefined
> = {
  all: undefined,
  orders: "ORDER_STATUS_CHANGED",
  offers: "FAVORITE_PRICE_DROPPED",
};

function formatNotificationDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "ORDER_STATUS_CHANGED":
      return <Package className="h-5 w-5" />;

    case "FAVORITE_PRICE_DROPPED":
      return <Tag className="h-5 w-5" />;

    default:
      return <Bell className="h-5 w-5" />;
  }
}

function getNotificationTypeLabel(type: NotificationType) {
  switch (type) {
    case "ORDER_STATUS_CHANGED":
      return "Pedido";

    case "FAVORITE_PRICE_DROPPED":
      return "Oferta";

    default:
      return "Notificación";
  }
}

function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const isOrderNotification =
    notification.type === "ORDER_STATUS_CHANGED";

  return (
    <article
      className={`flex gap-4 border-b border-slate-300 px-1 py-6 ${
        notification.isRead ? "bg-white" : "bg-[#f8faff]"
      }`}
    >
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-[#1822d9]">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {notification.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {notification.message}
            </p>
          </div>

          {!notification.isRead && (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1822d9]" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{getNotificationTypeLabel(notification.type)}</span>

          <span>•</span>

          <span>{formatNotificationDate(notification.createdAt)}</span>

          {isOrderNotification && notification.orderRef && (
            <>
              <span>•</span>

              <span>
                Pedido {notification.orderRef.orderNumber}
              </span>
            </>
          )}

          {notification.productRef && (
            <>
              <span>•</span>

              <span>
                Producto {notification.productRef.productId}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] =
    useState<NotificationTab>("all");

  const {
    notifications,
    isLoading,
    error,
    retry,
    updateQuery,
  } = useNotifications();

  const filteredNotifications = useMemo(() => {
    const notificationType = notificationTypeByTab[activeTab];

    if (!notificationType) {
      return notifications;
    }

    return notifications.filter(
      (notification) => notification.type === notificationType,
    );
  }, [notifications, activeTab]);

  const handleTabChange = (tab: NotificationTab) => {
    setActiveTab(tab);

    const notificationType = notificationTypeByTab[tab];

    updateQuery({
      page: 1,
      limit: 10,
      ...(notificationType
        ? { type: notificationType }
        : {}),
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="space-y-2">
              <Link
                href="/cuenta"
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <User className="h-5 w-5" />
                <span>Cuenta</span>
              </Link>

              <Link
                href="/cuenta/pedidos"
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Pedidos</span>
              </Link>

              <Link
                href="/cuenta/favoritos"
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Heart className="h-5 w-5" />
                <span>Favoritos</span>
              </Link>

              <Link
                href="/cuenta/direcciones"
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <MapPin className="h-5 w-5" />
                <span>Direcciones</span>
              </Link>

              <Link
                href="/cuenta/notificaciones"
                className="flex items-center gap-4 rounded-lg border-l-4 border-blue-300 bg-[#eef3fb] px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <Bell className="h-5 w-5" />
                <span>Notificaciones</span>
              </Link>

              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar sesión</span>
              </button>
            </nav>
          </aside>

          {/* Contenido */}
          <main className="min-w-0">
            {/* Navegación móvil */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              <Link
                href="/cuenta"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                <User className="h-4 w-4" />
                Cuenta
              </Link>

              <Link
                href="/cuenta/pedidos"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Pedidos
              </Link>

              <Link
                href="/cuenta/favoritos"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                <HeartIcon className="h-4 w-4" />
                Favoritos
              </Link>

              <Link
                href="/cuenta/direcciones"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                <MapPin className="h-4 w-4" />
                Direcciones
              </Link>

              <Link
                href="/cuenta/notificaciones"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-blue-300 bg-[#eef3fb] px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <Bell className="h-4 w-4" />
                Notificaciones
              </Link>
            </div>

            

            {/* Título */}
            <div className="mb-5">
              <h1 className="text-4xl font-medium tracking-tight text-slate-800 sm:text-5xl">
                Notificaciones
              </h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-300">
              <div className="flex gap-8">
                <button
                  type="button"
                  onClick={() => handleTabChange("all")}
                  className={`relative pb-4 text-sm font-semibold transition ${
                    activeTab === "all"
                      ? "text-slate-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Todas

                  {activeTab === "all" && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1822d9]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("orders")}
                  className={`relative pb-4 text-sm font-semibold transition ${
                    activeTab === "orders"
                      ? "text-slate-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pedidos

                  {activeTab === "orders" && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1822d9]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("offers")}
                  className={`relative pb-4 text-sm font-semibold transition ${
                    activeTab === "offers"
                      ? "text-slate-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Ofertas

                  {activeTab === "offers" && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1822d9]" />
                  )}
                </button>
              </div>
            </div>

            {/* Estados */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1822d9]" />
                  Cargando notificaciones...
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 text-red-500" />

                  <div>
                    <p className="font-semibold text-red-700">
                      No fue posible cargar las notificaciones.
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => void retry()}
                      className="mt-3 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista */}
            {!isLoading && !error && (
              <>
                {filteredNotifications.length > 0 ? (
                  <div>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f5fd] text-slate-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>

                    <h2 className="mt-5 text-lg font-semibold text-slate-800">
                      No tienes notificaciones
                    </h2>

                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Cuando tengas nuevas notificaciones,
                      aparecerán aquí.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}