"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getUsers,
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

        setData(response.data);

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

        console.error(
          "Error al cargar los usuarios:",
          caughtError,
        );

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible cargar los usuarios.";

        setData([]);

        setMeta({
          total: 0,
          page,
          limit,
          totalPages: 1,
        });

        setError(message);
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