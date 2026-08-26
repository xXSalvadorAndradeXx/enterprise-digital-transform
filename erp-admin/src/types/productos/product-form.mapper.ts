import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "./product-request.types";

import type {
  ProductFormSchema,
} from "./schemas";

import type {
  ProductVariantConfig,
} from "./product-variant.types";

interface MapProductFormOptions {
  imageUrls: string[];
  variantConfigs: ProductVariantConfig[];
}

export function mapProductFormToCreateRequest(
  values: ProductFormSchema,
  options: MapProductFormOptions,
): CreateProductRequest {
  return {
    inventoryId:
      values.inventoryId,

    commercialName:
      values.commercialName.trim(),

    description:
      values.description.trim() ||
      null,

    salePrice:
      Number(
        values.salePrice,
      ),

    discount:
      values.applyDiscount
        ? Number(
            values.discount,
          )
        : 0,

    discountStartsAt:
      values.applyDiscount
        ? values.discountStartsAt
        : null,

    discountEndsAt:
      values.applyDiscount
        ? values.discountEndsAt
        : null,

    status:
      values.status,

    isPublished:
      values.status === "ACTIVE",

    tags:
      values.tags.map(
        (tag) =>
          tag.trim(),
      ),

    imageUrls:
      options.imageUrls,

    variantConfigs:
      options.variantConfigs,
  };
}

export function mapProductFormToUpdateRequest(
  values: ProductFormSchema,
  options: MapProductFormOptions,
): UpdateProductRequest {
  return {
    commercialName:
      values.commercialName.trim(),

    description:
      values.description.trim() ||
      null,

    salePrice:
      Number(
        values.salePrice,
      ),

    discount:
      values.applyDiscount
        ? Number(
            values.discount,
          )
        : 0,

    discountStartsAt:
      values.applyDiscount
        ? values.discountStartsAt
        : null,

    discountEndsAt:
      values.applyDiscount
        ? values.discountEndsAt
        : null,

    tags:
      values.tags.map(
        (tag) =>
          tag.trim(),
      ),

    imageUrls:
      options.imageUrls,

    variantConfigs:
      options.variantConfigs,
  };
}
