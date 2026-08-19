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

const PRODUCTS_API_URL =
  "/api/products";

function getJsonHeaders():
  HeadersInit {
  return {
    "Content-Type":
      "application/json",
  };
}

/**
 * GET /api/products
 */
export async function listProducts(
  query: ProductQuery = {},
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const response =
    await fetch(
      `${PRODUCTS_API_URL}${buildProductQueryString(
        query,
      )}`,
      {
        method:
          "GET",

        headers:
          getJsonHeaders(),

        signal,

        cache:
          "no-store",
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<ProductListResponse>;
}

/**
 * GET /api/products/:id
 */
export async function getProductById(
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetailResponse> {
  const response =
    await fetch(
      `${PRODUCTS_API_URL}/${id}`,
      {
        method:
          "GET",

        headers:
          getJsonHeaders(),

        signal,

        cache:
          "no-store",
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  return response.json() as Promise<ProductDetailResponse>;
}

/**
 * POST /api/products
 */
export async function createProduct(
  request:
    CreateProductRequest,
): Promise<CreateProductResponse> {
  const response =
    await fetch(
      PRODUCTS_API_URL,
      {
        method:
          "POST",

        headers:
          getJsonHeaders(),

        body:
          JSON.stringify(
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

/**
 * PATCH /api/products/:id
 */
export async function updateProduct(
  id: string,

  request:
    UpdateProductRequest,
): Promise<UpdateProductResponse> {
  const response =
    await fetch(
      `${PRODUCTS_API_URL}/${id}`,
      {
        method:
          "PATCH",

        headers:
          getJsonHeaders(),

        body:
          JSON.stringify(
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

/**
 * PATCH /api/products/:id/status
 */
export async function updateProductStatus(
  id: string,

  request:
    UpdateProductStatusRequest,
): Promise<UpdateProductStatusResponse> {
  const response =
    await fetch(
      `${PRODUCTS_API_URL}/${id}/status`,
      {
        method:
          "PATCH",

        headers:
          getJsonHeaders(),

        body:
          JSON.stringify(
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

/**
 * DELETE /api/products/:id
 */
export async function deleteProduct(
  id: string,
): Promise<void> {
  const response =
    await fetch(
      `${PRODUCTS_API_URL}/${id}`,
      {
        method:
          "DELETE",
      },
    );

  if (!response.ok) {
    throw await normalizeProductHttpError(
      response,
    );
  }

  /**
   * Backend responde 204.
   */
}