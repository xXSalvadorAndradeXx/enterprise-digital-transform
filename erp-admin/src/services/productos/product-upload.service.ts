import {
  API_BASE_URL,
} from "@/lib/api";

import type {
  ProductImageUploadResponse,
} from "@/types/productos";

import {
  normalizeProductHttpError,
} from "./product-errors";

function getAuthorizationHeader(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function uploadProductImage(
  file: File,
  signal?: AbortSignal,
): Promise<ProductImageUploadResponse> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await fetch(
      `${API_BASE_URL}/products/upload-image`,
      {
        method: "POST",
        headers:
          getAuthorizationHeader(),
        body: formData,
        signal,
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<ProductImageUploadResponse>;
}