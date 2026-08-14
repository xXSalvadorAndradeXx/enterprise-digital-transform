export type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "DISCONTINUED";

export interface ProductImageDto {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface ProductVariantConfigDto {
  inventoryDetailId: string;
  minStock: number;
  sku: string;
  size: string;
  color: string;
  stock: number;
  stockStatus: string;
}

export interface ProductCreatedByDto {
  id: string;
  firstName: string;
  lastName: string;
}

/*
 * El contrato indica que inventory corresponde a InventoryResponseDto,
 * pero este documento no detalla aquí la estructura completa de ese DTO.
 *
 * No inventamos propiedades dentro del DTO de API.
 */
export interface ProductResponseDto {
  id: string;
  commercialName: string;
  description: string | null;
  salePrice: number;
  discount: number;
  discountEndsAt: string | null;
  effectivePrice: number;
  status: ProductStatus;
  tags: string[];
  images: ProductImageDto[];
  inventory: unknown;
  variantConfigs: ProductVariantConfigDto[];
  createdBy: ProductCreatedByDto;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductByIdResponse {
  data: ProductResponseDto;
  statusCode: 200;
}