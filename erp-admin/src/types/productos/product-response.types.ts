import type {
  PaginationMeta,
} from "./pagination.types";

import type {
  ProductStatus,
} from "./product.types";

import type {
  ProductImage,
} from "./product-image.types";

import type {
  ProductCreatedBy,
} from "./product-user.types";

import type {
  ProductVariantDetail,
} from "./product-variant.types";

import type {
  InventoryResponseDto,
} from "@/app/(erp)/inventario/types";

export interface ProductDetail {
  id: string;

  commercialName: string;

  description:
    | string
    | null;

  salePrice: number;

  /**
   * Backend puede responder null
   * cuando no existe descuento.
   */
  discount:
    | number
    | null;

  /**
   * Fecha en la que comienza
   * la vigencia del descuento.
   */
  discountStartsAt:
    | string
    | null;

  /**
   * Fecha en la que finaliza
   * la vigencia del descuento.
   */
  discountEndsAt:
    | string
    | null;

  /**
   * Precio definitivo calculado
   * por Backend.
   */
  effectivePrice: number;

  status:
    ProductStatus;

  tags:
    string[];

  images:
    ProductImage[];

  /**
   * El producto puede no tener
   * inventario asociado.
   */
  inventory:
    | InventoryResponseDto
    | null;

  variantConfigs:
    ProductVariantDetail[];

  createdBy:
    ProductCreatedBy;

  createdAt:
    string;

  updatedAt:
    string;
}

/**
 * Actualmente el listado utiliza la
 * misma estructura base del producto.
 *
 * Si Backend define posteriormente un
 * DTO resumido independiente, este tipo
 * deberá actualizarse.
 */
export type ProductSummary =
  ProductDetail;

export interface ProductListResponse {
  data:
    ProductSummary[];

  meta:
    PaginationMeta;
}

export interface ProductDetailResponse {
  data:
    ProductDetail;

  statusCode:
    200;
}

export interface CreateProductResponse {
  data:
    ProductDetail;

  statusCode:
    201;
}

export interface UpdateProductResponse {
  data:
    ProductDetail;

  statusCode:
    200;
}

export interface UpdateProductStatusResponse {
  data:
    ProductDetail;

  statusCode:
    200;
}