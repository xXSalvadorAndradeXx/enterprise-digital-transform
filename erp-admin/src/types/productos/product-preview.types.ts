import type { ProductStatus } from "./product-response.types";

export interface ProductPreviewImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface ProductPreviewData {
  id: string;

  commercialName: string;
  description: string | null;

  category: string;
  sku: string;

  salePrice: number;
  discount: number;
  effectivePrice: number;

  stock: number;
  stockLabel: string;

  status: ProductStatus;

  tags: string[];

  images: ProductPreviewImage[];
}