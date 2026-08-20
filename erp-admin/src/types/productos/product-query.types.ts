import type {
  ProductSortBy,
  ProductSortOrder,
  ProductInventoryStockStatus,
} from "./product.types";

export interface ProductQuery {
  page?: number;

  limit?: number;

  search?: string;

  stockStatus?: ProductInventoryStockStatus;

  supplierId?: string;

  categoryId?: string;

  tag?: string;

  minPrice?: number;

  maxPrice?: number;

  sortBy?: ProductSortBy;

  order?: ProductSortOrder;
}
