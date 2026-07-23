"use client";

import { useEffect, useRef, useState } from "react";

import {
  getCompras,
  type PurchasesRequestAdapter,
} from "../services/getCompras";
import type {
  PurchasesPaginationMetadata,
  PurchasesQuery,
} from "../types/purchases.types";

export interface UseComprasOptions {
  query: PurchasesQuery;
  request: PurchasesRequestAdapter;
  enabled?: boolean;
}

export interface UseComprasResult {
  data: readonly unknown[];
  metadata: PurchasesPaginationMetadata | null;
  loading: boolean;
  error: Error | null;
}

export function useCompras({
  query,
  request,
  enabled = true,
}: UseComprasOptions): UseComprasResult {
  const [data, setData] = useState<readonly unknown[]>([]);
  const [metadata, setMetadata] =
    useState<PurchasesPaginationMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);
  const { search, page, limit } = query;

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!enabled) {
      queueMicrotask(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted || requestIdRef.current !== requestId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getCompras(
          { search, page, limit },
          request,
          controller.signal,
        );

        if (controller.signal.aborted || requestIdRef.current !== requestId) return;

        setData(result.data);
        setMetadata(result.metadata);
      } catch (caughtError) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;

        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Ocurrió un error técnico al consultar las compras."),
        );
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    });

    return () => controller.abort();
  }, [enabled, limit, page, request, search]);

  return { data, metadata, loading, error };
}
