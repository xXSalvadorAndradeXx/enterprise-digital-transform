import type {
  CreateProductRequest,
  CreateProductResponse,
  ProductDetail,
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

function normalizeProductTags(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const tags = value.flatMap((item) => {
    if (typeof item === "string") {
      const tag = item.trim();
      return tag ? [tag] : [];
    }

    if (
      typeof item === "object" &&
      item !== null &&
      "tag" in item &&
      typeof item.tag === "string"
    ) {
      const tag = item.tag.trim();
      return tag ? [tag] : [];
    }

    return [];
  });

  return Array.from(new Set(tags));
}

function normalizeProduct(
  product: ProductDetail,
): ProductDetail {
  return {
    ...product,
    tags: normalizeProductTags(
      product.tags,
    ),
  };
}

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

  const body =
    await response.json() as ProductListResponse;

  return {
    ...body,
    data: body.data.map(
      normalizeProduct,
    ),
  };
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

  const body =
    await response.json() as ProductDetailResponse;

  return {
    ...body,
    data: normalizeProduct(
      body.data,
    ),
  };
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

  const body =
    await response.json() as CreateProductResponse;

  return {
    ...body,
    data: normalizeProduct(
      body.data,
    ),
  };
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

  const body =
    await response.json() as UpdateProductResponse;

  return {
    ...body,
    data: normalizeProduct(
      body.data,
    ),
  };
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

  const body =
    await response.json() as UpdateProductStatusResponse;

  return {
    ...body,
    data: normalizeProduct(
      body.data,
    ),
  };
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
