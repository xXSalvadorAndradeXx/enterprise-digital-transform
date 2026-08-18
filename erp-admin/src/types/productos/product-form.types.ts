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
 * Modelo visual de una variante del inventario
 * utilizada dentro del formulario de Productos.
 *
 * Se construye a partir de InventoryDetailDto.
 */
export interface InventoryVariantView {
  inventoryDetailId: string;

  sku: string;

  size: string;
  color: string;

  stock: number;
  minStock: number;

  stockStatus:
    | "ALTO"
    | "MEDIO"
    | "BAJO";
}

/**
 * Modelo de presentación utilizado por Productos.
 *
 * No reemplaza los DTO del módulo Inventario.
 * Únicamente adapta InventoryWithDetailsDto
 * a la información que necesita mostrar
 * ProductInventoryPanel.
 */
export interface InventoryProductView {
  inventoryId: string;

  name: string;
  brand: string;

  supplier: string;
  category: string;

  inventoryStatus:
    | "ACTIVE"
    | "LOW_STOCK"
    | "OUT_OF_STOCK";

  totalStock: number;

  variants: InventoryVariantView[];
}