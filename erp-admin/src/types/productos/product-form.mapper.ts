import type {
  CreateProductRequest,
} from "./product-request.types";

import type {
  ProductFormSchema,
} from "./schemas";

interface MapProductFormOptions {
  imageUrls: string[];
}

export function mapProductFormToCreateRequest(
  values: ProductFormSchema,
  options: MapProductFormOptions,
): CreateProductRequest {
  return {
    inventoryId: values.inventoryId,

    commercialName:
      values.commercialName.trim(),

    description:
      values.description.trim() || null,

    salePrice:
      Number(values.salePrice),

    discount:
      values.applyDiscount
        ? Number(values.discount)
        : 0,

    discountEndsAt:
      values.applyDiscount
        ? values.discountEndsAt
        : null,

    status:
      values.status,

    tags:
      values.tags.map(
        (tag) => tag.trim(),
      ),

    imageUrls:
      options.imageUrls,
  };
}