"use client";

import {
  useState,
} from "react";

import {
  createProduct,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  CreateProductRequest,
  ProductDetail,
} from "@/types/productos";

interface UseCreateProductResult {
  create:
    (
      request:
        CreateProductRequest,
    ) => Promise<
      ProductDetail | null
    >;

  isLoading:
    boolean;

  error:
    ProductHttpError | null;
}

export function useCreateProduct(): UseCreateProductResult {
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

  const create =
    async (
      request:
        CreateProductRequest,
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
          await createProduct(
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
              "No se pudo crear el producto.",
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    };

  return {
    create,
    isLoading,
    error,
  };
}