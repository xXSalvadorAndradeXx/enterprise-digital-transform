export type ProductFormMode =
  | "create"
  | "edit";

export type ProductPublicationStatus =
  | "DRAFT"
  | "ACTIVE";

export interface ProductFormValues {
  inventoryId: string;

  commercialName: string;
  salePrice: string;

  applyDiscount: boolean;
  discount: string;
  discountEndsAt: string;

  description: string;

  tags: string[];

  imageUrls: string[];

  status:
    | ProductPublicationStatus
    | "";
}

/**
 * Modelo visual utilizado únicamente por el formulario
 * de Productos.
 *
 * No representa InventoryResponseDto del Backend.
 */
export interface InventoryVariantView {
  id: string;

  size: string;
  color: string;
  colorHex?: string;

  stock: number;
  minStock: number;
}

/**
 * Modelo de presentación para mostrar la información
 * heredada del inventario dentro del formulario.
 *
 * Posteriormente será construido a partir de los DTO
 * reales del módulo Inventario.
 */
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