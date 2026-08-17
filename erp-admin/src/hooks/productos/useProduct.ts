"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getProductById,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  ProductDetail,
} from "@/types/productos";

interface UseProductResult {
  product:
    ProductDetail | null;

  isLoading:
    boolean;

  error:
    ProductHttpError | null;

  refetch:
    () => void;
}

export function useProduct(
  id: string | null,
): UseProductResult {
  const [
    product,
    setProduct,
  ] =
    useState<ProductDetail | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(id),
  );

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
    if (!id) {
      return;
    }

    const controller =
      new AbortController();

    let isActive = true;

    const load =
      async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
          const response =
            await getProductById(
              id,
              controller.signal,
            );

          if (!isActive) {
            return;
          }

          setProduct(
            response.data,
          );
        } catch (caughtError) {
          if (
            controller.signal
              .aborted ||
            !isActive
          ) {
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
                "No se pudo cargar el producto.",
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
    id,
    refreshKey,
  ]);

  return {
    product,
    isLoading,
    error,

    refetch: () =>
      setRefreshKey(
        (current) =>
          current + 1,
      ),
  };
}