"use client";

import {
  useRef,
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

  const updatingRef =
    useRef(false);

  const update = async (
    id: string,
    request: UpdateProductRequest,
  ): Promise<ProductDetail | null> => {
    if (updatingRef.current) {
      return null;
    }

    updatingRef.current = true;

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
      updatingRef.current =
        false;

      setIsLoading(false);
    }
  };

  return {
    update,
    isLoading,
    error,
  };
}