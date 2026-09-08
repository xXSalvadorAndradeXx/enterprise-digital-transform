"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrders } from "@/services/orders/orders.service";
import type {
  OrderListItem,
  OrdersPaginationMeta,
  OrdersQuery,
} from "@/types/orders/order.types";

export interface UseOrdersValue {
  orders: OrderListItem[];
  meta: OrdersPaginationMeta | null;
  query: OrdersQuery;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  updateQuery: (query: OrdersQuery) => void;
  refreshOrders: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useOrders(
  initialQuery: OrdersQuery = {
    page: 1,
    limit: 10,
    sortOrder: "DESC",
  },
): UseOrdersValue {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [meta, setMeta] = useState<OrdersPaginationMeta | null>(null);
  const [query, setQuery] = useState<OrdersQuery>(initialQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async (currentQuery: OrdersQuery) => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrders(currentQuery);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setOrders(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible cargar tus pedidos.";

      setError(message);
      setOrders([]);
      setMeta(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOrders(query);
  }, [loadOrders, query]);

  const setPage = useCallback((page: number) => {
    setQuery((currentQuery) => ({
      ...currentQuery,
      page,
    }));
  }, []);

  const updateQuery = useCallback((nextQuery: OrdersQuery) => {
    setQuery({
      ...nextQuery,
      page: 1,
    });
  }, []);

  const refreshOrders = useCallback(async () => {
    await loadOrders(query);
  }, [loadOrders, query]);

  const retry = useCallback(async () => {
    await loadOrders(query);
  }, [loadOrders, query]);

  return {
    orders,
    meta,
    query,
    isLoading,
    error,
    setPage,
    updateQuery,
    refreshOrders,
    retry,
  };
}

export default useOrders;