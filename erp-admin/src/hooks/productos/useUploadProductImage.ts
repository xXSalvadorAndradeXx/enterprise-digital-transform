"use client";

import {
  useState,
} from "react";

import {
  uploadProductImage,
} from "@/services/productos/product-upload.service";

import {
  isProductHttpError,
  type ProductHttpError,
} from "@/services/productos/product-errors";

import type {
  ProductImageUploadData,
} from "@/types/productos";

export function useUploadProductImage() {
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

  const upload =
    async (
      file: File,
    ): Promise<
      ProductImageUploadData | null
    > => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await uploadProductImage(
            file,
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
              "No se pudo subir la imagen.",
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    };

  return {
    upload,
    isLoading,
    error,
  };
}