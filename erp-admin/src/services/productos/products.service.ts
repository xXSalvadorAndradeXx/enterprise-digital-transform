import {
  API_BASE_URL,
} from "@/lib/api";

import type {
  CreateProductRequest,
  CreateProductResponse,
  ProductDetailResponse,
  ProductListResponse,
  ProductQuery,
  UpdateProductRequest,
  UpdateProductResponse,
  UpdateProductStatusRequest,
  UpdateProductStatusResponse,
} from "@/types/productos";

import {
  buildProductQueryString,
} from "./product-query";

import {
  normalizeProductHttpError,
} from "./product-errors";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !==
    "undefined"
      ? localStorage.getItem(
          "token",
        )
      : null;

  return {
    "Content-Type":
      "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };
}

export async function listProducts(
  query: ProductQuery = {},
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/products${buildProductQueryString(
        query,
      )}`,
      {
        method: "GET",
        headers:
          getAuthHeaders(),
        signal,
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function getProductById(
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetailResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/products/${id}`,
      {
        method: "GET",
        headers:
          getAuthHeaders(),
        signal,
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<ProductDetailResponse>;
}

export async function createProduct(
  request:
    CreateProductRequest,
): Promise<CreateProductResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/products`,
      {
        method: "POST",

        headers:
          getAuthHeaders(),

        body: JSON.stringify(
          request,
        ),
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<CreateProductResponse>;
}

export async function updateProduct(
  id: string,
  request:
    UpdateProductRequest,
): Promise<UpdateProductResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/products/${id}`,
      {
        method: "PATCH",

        headers:
          getAuthHeaders(),

        body: JSON.stringify(
          request,
        ),
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<UpdateProductResponse>;
}

export async function updateProductStatus(
  id: string,
  request:
    UpdateProductStatusRequest,
): Promise<UpdateProductStatusResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/products/${id}/status`,
      {
        method: "PATCH",

        headers:
          getAuthHeaders(),

        body: JSON.stringify(
          request,
        ),
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<UpdateProductStatusResponse>;
}

export async function deleteProduct(
  id: string,
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/products/${id}`,
      {
        method: "DELETE",

        headers:
          getAuthHeaders(),
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  /*
   * DELETE responde 204.
   * No intentamos parsear JSON.
   */
}