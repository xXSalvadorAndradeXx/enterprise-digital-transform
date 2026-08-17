"use client";

import {
  useState,
} from "react";

import {
  deleteProduct,
} from "@/services/productos/products.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

export function useDeleteProduct() {
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

  const remove =
    async (
      id: string,
    ): Promise<boolean> => {
      if (isLoading) {
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await deleteProduct(
          id,
        );

        return true;
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
              "No se pudo eliminar el producto.",
          });
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    };

  return {
    remove,
    isLoading,
    error,
  };
}