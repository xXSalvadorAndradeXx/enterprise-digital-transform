import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type {
  NotificationsPaginationMeta,
  NotificationsQuery,
  NotificationsResponse,
  Notification,
} from "@/types/notifications/notification.types";

type BackendNotificationsResponse = {
  success: boolean;
  data: {
    notifications: Notification[];
    meta: NotificationsPaginationMeta;
  };
};

function getAuthHeaders() {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Debes iniciar sesion para consultar tus notificaciones.",
      401,
      null,
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildNotificationsQuery(query: NotificationsQuery) {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.isRead !== undefined) {
    params.set("isRead", String(query.isRead));
  }

  if (query.type !== undefined) {
    params.set("type", query.type);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getNotifications(
  query: NotificationsQuery = {},
): Promise<NotificationsResponse> {
  const response = await apiRequest<BackendNotificationsResponse>(
    `/customers/me/notifications${buildNotificationsQuery(query)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return {
    data: response.data.notifications,
    meta: response.data.meta,
  };
}