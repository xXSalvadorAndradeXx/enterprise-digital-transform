"use client";
import { useRef } from "react";
import { useCallback, useEffect, useState } from "react";

import { getMovements } from "../services/movement.service";

import type {
  MovementQueryDto,
  MovementResponseDto,
  PaginationMetaDto,
} from "../types";

const INITIAL_QUERY: MovementQueryDto = {
  page: 1,
  limit: 20,
};

const EMPTY_META: PaginationMetaDto = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export function useMovements() {
  const requestId = useRef(0);
  const [query, setQuery] = useState<MovementQueryDto>(INITIAL_QUERY);

  const [items, setItems] = useState<MovementResponseDto[]>([]);
  const [meta, setMeta] = useState<PaginationMetaDto>(EMPTY_META);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMovements = useCallback(async () => {
  const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(null);

      const response = await getMovements(query);

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
          : "No se pudieron cargar los movimientos."
      );
    } finally {
      if (currentRequest !== requestId.current) {
  return;
}
    }
  }, [query]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  const updateQuery = useCallback(
    (changes: Partial<MovementQueryDto>) => {
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
    void loadMovements();
  }, [loadMovements]);

  return {
    query,
    updateQuery,

    items,
    meta,

    loading,
    error,

    retry,
  };
}