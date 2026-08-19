"use client";

import {
  useRef,
  useState,
} from "react";

import {
  updateProductStatus,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  ProductDetail,
  UpdateProductStatusRequest,
} from "@/types/productos";

export function useUpdateProductStatus() {
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<ProductHttpError | null>(
      null,
    );

  const changingRef =
    useRef(false);

  const changeStatus =
    async (
      id: string,
      request:
        UpdateProductStatusRequest,
    ): Promise<
      ProductDetail | null
    > => {
      if (
        changingRef.current
      ) {
        return null;
      }

      changingRef.current =
        true;

      setIsLoading(true);
      setError(null);

      try {
        const response =
          await updateProductStatus(
            id,
            request,
          );

        return response.data;
      } catch (caughtError) {
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
              "No se pudo cambiar el estado del producto.",
          });
        }

        return null;
      } finally {
        changingRef.current =
          false;

        setIsLoading(false);
      }
    };

  return {
    changeStatus,
    isLoading,
    error,
  };
}