"use client";

import {
  useRef,
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
  ProductImageUploadResponse,
} from "@/types/productos";

interface UseUploadProductImagesResult {
  uploadImages: (
    files: File[],
  ) => Promise<string[] | null>;

  isUploading: boolean;

  error: ProductHttpError | null;
}

export function useUploadProductImages(): UseUploadProductImagesResult {
  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<ProductHttpError | null>(
      null,
    );

  const isUploadingRef =
    useRef(false);

  const uploadImages = async (
    files: File[],
  ): Promise<string[] | null> => {
    if (
      isUploadingRef.current
    ) {
      return null;
    }

    if (
      files.length === 0
    ) {
      return [];
    }

    isUploadingRef.current =
      true;

    setIsUploading(true);
    setError(null);

    try {
      const responses:
        ProductImageUploadResponse[] =
        await Promise.all(
          files.map(
            (
              file,
            ): Promise<ProductImageUploadResponse> =>
              uploadProductImage(
                file,
              ),
          ),
        );

      return responses.map(
        (
          response:
            ProductImageUploadResponse,
        ) =>
          response.data.imageUrl,
      );
    } catch (
      caughtError
    ) {
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
            "No se pudieron subir las imágenes.",
        });
      }

      return null;
    } finally {
      isUploadingRef.current =
        false;

      setIsUploading(false);
    }
  };

  return {
    uploadImages,
    isUploading,
    error,
  };
}