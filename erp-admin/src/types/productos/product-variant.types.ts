export interface ProductVariantConfig {
  inventoryDetailId: string;
  minStock: number;
}

export interface ProductVariantDetail {
  inventoryDetailId: string;
  minStock: number;
  sku: string;
  size: string;
  color: string;
  stock: number;
  stockStatus: string;
}