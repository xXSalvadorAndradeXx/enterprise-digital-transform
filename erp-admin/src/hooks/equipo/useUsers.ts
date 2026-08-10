"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getUsers,
  UsersRequestError,
  type GetUsersParams,
  type User,
} from "@/services/equipo/getUsers";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useUsers({
  page = 1,
  limit = 10,
  search = "",
}: GetUsersParams = {}) {
  const normalizedSearch = search.trim();

  const [data, setData] = useState<User[]>([]);

  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page,
    limit,
    totalPages: 1,
  });

  const [error, setError] = useState<string | null>(
    null,
  );

  const [refreshKey, setRefreshKey] = useState(0);

  const [completedRequestKey, setCompletedRequestKey] =
    useState("");

  const requestKey = useMemo(
    () =>
      `${page}-${limit}-${normalizedSearch}-${refreshKey}`,
    [page, limit, normalizedSearch, refreshKey],
  );

  const isLoading =
    completedRequestKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    getUsers({
      page,
      limit,
      search: normalizedSearch,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const sortedUsers = [...response.data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );

        setData(sortedUsers);

        setMeta({
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
          totalPages: Math.max(
            response.meta.totalPages,
            1,
          ),
        });

        setError(null);
      })
.catch((caughtError: unknown) => {
  if (cancelled) {
    return;
  }

  if (caughtError instanceof UsersRequestError) {
    const normalizedMessage =
      caughtError.message.toLowerCase();

    const accountDisabled =
      caughtError.status === 401 &&
      (
        normalizedMessage.includes("inactiva") ||
        normalizedMessage.includes("invalidada") ||
        normalizedMessage.includes("usuario no encontrado")
      );

    if (accountDisabled) {
      window.dispatchEvent(
        new CustomEvent("auth:account-disabled", {
          detail: {
            message: caughtError.message,
          },
        }),
      );

      setError(null);
      return;
    }

    if (
      caughtError.status === 503 ||
      caughtError.status === 504
    ) {
      setData([]);
      setError(
        "No se pudo conectar con el servicio de usuarios.",
      );
      return;
    }

    if (caughtError.status === 401) {
      window.dispatchEvent(
        new CustomEvent("auth:session-expired", {
          detail: {
            message: caughtError.message,
          },
        }),
      );

      setError(null);
      return;
    }

    setData([]);
    setError(caughtError.message);
    return;
  }

  setData([]);
  setError(
    "Ocurrió un error inesperado al cargar los usuarios.",
  );
})
      .finally(() => {
        if (cancelled) {
          return;
        }

        setCompletedRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [
    page,
    limit,
    normalizedSearch,
    refreshKey,
    requestKey,
  ]);

  const refetch = useCallback(() => {
    setRefreshKey(
      (currentKey) => currentKey + 1,
    );
  }, []);

  return {
    data,
    meta,
    isLoading,
    error,
    refetch,
  };
}

