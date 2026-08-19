"use client";

import {
  useRef,
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

  const deletingRef =
    useRef(false);

  const remove =
    async (
      id: string,
    ): Promise<boolean> => {
      if (
        deletingRef.current
      ) {
        return false;
      }

      deletingRef.current =
        true;

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
        deletingRef.current =
          false;

        setIsLoading(false);
      }
    };

  return {
    remove,
    isLoading,
    error,
  };
}