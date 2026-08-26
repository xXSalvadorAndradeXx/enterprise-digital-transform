import type {
  ProductImageUploadResponse,
} from "@/types/productos";

import {
  normalizeProductHttpError,
} from "./product-errors";
import { unwrapApiSuccess } from "@/lib/api-response";

const PRODUCT_UPLOAD_API_URL =
  "/api/products/upload-image";

/**
 * Sube una imagen utilizando el
 * Route Handler de Next.js.
 *
 * Browser
 *   ↓
 * Next.js
 *   ↓
 * Backend NestJS
 */
export async function uploadProductImage(
  file: File,
  signal?: AbortSignal,
): Promise<ProductImageUploadResponse> {
  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await fetch(
      PRODUCT_UPLOAD_API_URL,
      {
        method:
          "POST",

        body:
          formData,

        signal,
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  const responseBody: unknown = await response.json();

  return unwrapApiSuccess<ProductImageUploadResponse>(responseBody);
}
