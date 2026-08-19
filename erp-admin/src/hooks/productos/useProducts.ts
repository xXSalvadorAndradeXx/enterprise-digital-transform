"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  listProducts,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  PaginationMeta,
  ProductQuery,
  ProductSummary,
} from "@/types/productos";
interface UseProductsResult {
  products:
    ProductSummary[];

  meta:
    PaginationMeta | null;

  isLoading:
    boolean;

  error:
    ProductHttpError | null;

  refetch:
    () => void;
}

export function useProducts(
  query: ProductQuery,
): UseProductsResult {
  const [
    products,
    setProducts,
  ] =
    useState<ProductSummary[]>(
      [],
    );

  const [
    meta,
    setMeta,
  ] =
    useState<PaginationMeta | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<ProductHttpError | null>(
      null,
    );

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    let isActive = true;

    const load =
      async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
          const response =
            await listProducts(
              query,
              controller.signal,
            );

          if (!isActive) {
            return;
          }

          setProducts(
            response.data,
          );

          setMeta(
            response.meta,
          );
        } catch (caughtError) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          if (!isActive) {
            return;
          }

          if (
            isProductHttpError(
              caughtError,
            )
          ) {
            setError(
              caughtError,
            );
          } else {
            setError({
              status: 0,
              type: "UNKNOWN",
              message:
                "No se pudieron cargar los productos.",
            });
          }
        } finally {
          if (
            isActive &&
            !controller.signal
              .aborted
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void load();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    query,
    refreshKey,
  ]);

  const refetch =
    (): void => {
      setRefreshKey(
        (current) =>
          current + 1,
      );
    };

  return {
    products,
    meta,
    isLoading,
    error,
    refetch,
  };
}