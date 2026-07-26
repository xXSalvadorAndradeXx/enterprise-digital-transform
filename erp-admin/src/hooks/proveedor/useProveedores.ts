import { useCallback, useEffect, useRef, useState } from "react";

import { getProveedores } from "@/services/proveedor/getProveedores";
import type {
  PaginationMeta,
  Proveedor,
} from "@/types/proveedor/proveedor.types";

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export function useProveedores(
  search: string,
  page: number,
  limit = 10,
) {
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    ...EMPTY_PAGINATION,
    limit,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadProviders = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await getProveedores({
        search,
        page,
        limit,
      });

      if (requestId === requestIdRef.current) {
        setProviders(response.data);
        setPagination(response.pagination);
      }
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setProviders([]);
        setPagination({
          ...EMPTY_PAGINATION,
          page,
          limit,
        });
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los proveedores.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [limit, page, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProviders();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [loadProviders]);

  const isEmpty =
    !loading &&
    !error &&
    providers.length === 0 &&
    search.trim() === "";

  const isNoResults =
    !loading &&
    !error &&
    providers.length === 0 &&
    search.trim() !== "";

  return {
    providers,
    pagination,
    loading,
    error,
    isEmpty,
    isNoResults,
    refresh: loadProviders,
  };
}
