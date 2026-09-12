"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications } from "@/services/notifications/notifications.service";
import type {
  Notification,
  NotificationsPaginationMeta,
  NotificationsQuery,
} from "@/types/notifications/notification.types";

export interface UseNotificationsValue {
  notifications: Notification[];
  meta: NotificationsPaginationMeta | null;
  query: NotificationsQuery;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  updateQuery: (query: NotificationsQuery) => void;
  refreshNotifications: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useNotifications(
  initialQuery: NotificationsQuery = {
    page: 1,
    limit: 10,
  },
): UseNotificationsValue {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] =
    useState<NotificationsPaginationMeta | null>(null);
  const [query, setQuery] =
    useState<NotificationsQuery>(initialQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadNotifications = useCallback(
    async (currentQuery: NotificationsQuery) => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getNotifications(currentQuery);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setNotifications(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "No fue posible cargar tus notificaciones.";

        setError(message);
        setNotifications([]);
        setMeta(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadNotifications(query);
  }, [loadNotifications, query]);

  const setPage = useCallback((page: number) => {
    setQuery((currentQuery) => ({
      ...currentQuery,
      page,
    }));
  }, []);

  const updateQuery = useCallback(
    (nextQuery: NotificationsQuery) => {
      setQuery({
        ...nextQuery,
        page: 1,
      });
    },
    [],
  );

  const refreshNotifications = useCallback(async () => {
    await loadNotifications(query);
  }, [loadNotifications, query]);

  const retry = useCallback(async () => {
    await loadNotifications(query);
  }, [loadNotifications, query]);

  return {
    notifications,
    meta,
    query,
    isLoading,
    error,
    setPage,
    updateQuery,
    refreshNotifications,
    retry,
  };
}

export default useNotifications;