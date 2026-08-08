"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getInventory,
  getInventoryVariants,
} from "../services/inventory.service";

import type {
  InventoryDetailDto,
  InventoryQueryDto,
  InventoryResponseDto,
  PaginationMetaDto,
} from "../types";

const INITIAL_QUERY: InventoryQueryDto = {
  page: 1,
  limit: 20,
};

const EMPTY_META: PaginationMetaDto = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export function useInventory() {
     const requestId = useRef(0);
  const [query, setQuery] = useState<InventoryQueryDto>(INITIAL_QUERY);

  const [items, setItems] = useState<InventoryResponseDto[]>([]);
  const [meta, setMeta] = useState<PaginationMetaDto>(EMPTY_META);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variantsCache = useRef<
    Record<string, readonly InventoryDetailDto[]>
  >({});

 
  const loadInventory = useCallback(async () => {
  const currentRequest = ++requestId.current;

  try {
    setLoading(true);
    setError(null);

    const response = await getInventory(query);

    if (currentRequest !== requestId.current) {
      return;
    }

    setItems([...response.data]);
    setMeta(response.meta);
    } catch (err) {
        if (currentRequest !== requestId.current) {
  return;
}
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el inventario."
      );
    } finally {
      if (currentRequest === requestId.current) {
  setLoading(false);
}
    }
  }, [query]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const updateQuery = useCallback(
    (changes: Partial<InventoryQueryDto>) => {
      setQuery((previous) => ({
        ...previous,
        ...changes,
        page:
          changes.page ??
          (Object.keys(changes).some((key) => key !== "page")
            ? 1
            : previous.page),
      }));
    },
    []
  );

  const retry = useCallback(() => {
    void loadInventory();
  }, [loadInventory]);

  const loadVariants = useCallback(async (id: string) => {
    if (variantsCache.current[id]) {
      return variantsCache.current[id];
    }

    const response = await getInventoryVariants(id);

    variantsCache.current[id] = response.data;

    return response.data;
  }, []);

  return {
    query,
    updateQuery,

    items,
    meta,

    loading,
    error,

    retry,
    loadVariants,
  };
}

export type UseInventoryReturn = ReturnType<typeof useInventory>;