import type {
  UpdateProductRequest,
} from "./product-request.types";

import type {
  ProductFormSchema,
} from "./schemas";

interface MapUpdateOptions {
  imageUrls: string[];
}

export function mapProductFormToUpdateRequest(
  values:
    ProductFormSchema,

  options:
    MapUpdateOptions,
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
  };
}