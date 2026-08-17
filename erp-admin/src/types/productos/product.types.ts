export type ProductStockStatus = "Alto" | "Medio" | "Bajo";

export interface ProductTableItem {
  id: string;
  imageUrl: string | null;
  name: string;
  category: string;
  price: number;
  stock: number;
  stockStatus: ProductStockStatus;
}

export interface ProductCatalogFilters {
  search: string;
  category: string;
  stockStatus: ProductStockStatus | "";
}

export type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "DISCONTINUED";

export type ProductCreateStatus =
  | "DRAFT"
  | "ACTIVE";

export type ProductUpdateStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISCONTINUED";

export type ProductSortBy =
  | "created_at"
  | "sale_price"
  | "commercial_name";

export type ProductSortOrder =
  | "ASC"
  | "DESC";