import type {
  ProductSortBy,
  ProductSortOrder,
  ProductStatus,
} from "./product.types";

export interface ProductQuery {
  page?: number;

  limit?: number;

  search?: string;

  status?: ProductStatus;

  supplierId?: string;

  categoryId?: string;

  tag?: string;

  minPrice?: number;

  maxPrice?: number;

  sortBy?: ProductSortBy;

  order?: ProductSortOrder;
}
