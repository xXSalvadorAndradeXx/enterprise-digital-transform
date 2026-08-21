"use client";

import {
  useRef,
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
  create: (
    request:
      CreateProductRequest,
  ) => Promise<
    ProductDetail | null
  >;

  isLoading: boolean;

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

  const submittingRef =
    useRef(false);

  const create = async (
    request:
      CreateProductRequest,
  ): Promise<
    ProductDetail | null
  > => {
    if (
      submittingRef.current
    ) {
      return null;
    }

    submittingRef.current =
      true;

    setIsLoading(true);
    setError(null);

    try {
      const response =
        await createProduct(
          request,
        );

      return response.data;
    } catch (caughtError) {
      const normalizedError:
        ProductHttpError =
        isProductHttpError(
          caughtError,
        )
          ? caughtError
          : {
              status: 0,
              type: "UNKNOWN",
              message:
                "No se pudo crear el producto.",
            };

      setError(
        normalizedError,
      );

      throw normalizedError;
    } finally {
      submittingRef.current =
        false;

      setIsLoading(false);
    }
  };

  return {
    create,
    isLoading,
    error,
  };
}
