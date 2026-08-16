"use client";

import {
  useState,
} from "react";

import {
  updateProduct,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  ProductDetail,
  UpdateProductRequest,
} from "@/types/productos";

export function useUpdateProduct() {
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

  const update =
    async (
      id: string,
      request:
        UpdateProductRequest,
    ): Promise<
      ProductDetail | null
    > => {
      if (isLoading) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response =
          await updateProduct(
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
              "No se pudo actualizar el producto.",
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    };

  return {
    update,
    isLoading,
    error,
  };
}