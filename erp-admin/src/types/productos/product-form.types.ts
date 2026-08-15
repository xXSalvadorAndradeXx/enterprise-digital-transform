export type ProductFormMode = "create" | "edit";

export type ProductPublicationStatus =
  | "DRAFT"
  | "ACTIVE";

export interface ProductFormValues {
  commercialName: string;
  salePrice: string;

  applyDiscount: boolean;
  discount: string;
  discountEndsAt: string;

  description: string;

  tags: string[];

  imageUrls: string[];

  status: ProductPublicationStatus | "";
}

export interface InventoryVariantView {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  minStock: number;
}

export interface InventoryProductView {
  inventoryId: string;

  sku: string;
  name: string;
  brand: string;
  supplier: string;
  category: string;

  inventoryStatus: string;

  variants: InventoryVariantView[];
}