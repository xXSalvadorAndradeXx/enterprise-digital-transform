import type {
  ProductCreateStatus,
  ProductUpdateStatus,
} from "./product.types";

import type {
  ProductVariantConfig,
} from "./product-variant.types";

export interface CreateProductRequest {
  inventoryId: string;
  commercialName: string;
  description?: string | null;
  salePrice: number;

  discount?: number;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;

  status?: ProductCreateStatus;

  tags?: string[];
  imageUrls?: string[];

  variantConfigs?: ProductVariantConfig[];
}

export interface UpdateProductRequest {
  commercialName?: string;
  description?: string | null;
  salePrice?: number;

  discount?: number;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;

  tags?: string[];
  imageUrls?: string[];

  variantConfigs?: ProductVariantConfig[];
}

export interface UpdateProductStatusRequest {
  status: ProductUpdateStatus;
}