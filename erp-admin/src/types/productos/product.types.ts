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