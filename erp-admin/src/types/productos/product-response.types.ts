import type { ProductStatus } from "./product.types";

import type { ProductImage } from "./product-image.types";

import type { ProductCreatedBy } from "./product-user.types";

import type { ProductVariantDetail } from "./product-variant.types";

/**
 * Representa la respuesta completa de un producto.
 *
 * Nota:
 * El contrato de Backend indica que `inventory`
 * corresponde a `InventoryResponseDto`.
 *
 * Ese tipo pertenece al módulo Inventario y todavía
 * no está expuesto en Frontend, por lo que se mantiene
 * temporalmente como `unknown` para no duplicar ni
 * inventar el contrato de otro módulo.
 */
export interface ProductDetail {
  id: string;
  commercialName: string;
  description: string | null;
  salePrice: number;
  discount: number;
  discountEndsAt: string | null;

  /**
   * Valor calculado por Backend.
   * Frontend únicamente lo consume.
   */
  effectivePrice: number;

  status: ProductStatus;

  tags: string[];

  images: ProductImage[];

  /**
   * Pendiente de sustituir por InventoryResponseDto
   * cuando el módulo Inventario exponga el tipo
   * correspondiente en Frontend.
   */
  inventory: unknown;

  variantConfigs: ProductVariantDetail[];

  createdBy: ProductCreatedBy;

  createdAt: string;
  updatedAt: string;
}

/**
 * El contrato actual no define un DTO resumido
 * independiente para el listado.
 *
 * GET /products devuelve la misma estructura
 * de producto dentro de data[].
 */
export type ProductSummary = ProductDetail;

/**
 * GET /products/:id
 */
export interface ProductDetailResponse {
  data: ProductDetail;
  statusCode: 200;
}

/**
 * POST /products
 */
export interface CreateProductResponse {
  data: ProductDetail;
  statusCode: 201;
}

/**
 * PATCH /products/:id
 */
export interface UpdateProductResponse {
  data: ProductDetail;
  statusCode: 200;
}

/**
 * PATCH /products/:id/status
 */
export interface UpdateProductStatusResponse {
  data: ProductDetail;
  statusCode: 200;
}