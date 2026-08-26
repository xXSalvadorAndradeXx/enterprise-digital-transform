export type PurchaseType = "NUEVO_PRODUCTO" | "REABASTECIMIENTO";
export type ProductGender = "FEMALE" | "MALE" | "UNISEX";

export interface PurchaseVariantResponse {
  id: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseResponse {
  id: string;
  reference: string;
  type: PurchaseType;
  productName: string;
  brand?: string;
  categoryId?: number;
  gender?: ProductGender | null;
  purchaseDate: string;
  totalAmount: number;
  totalQuantity: number;
  invoiceUrl: string | null;
  status: "COMPLETED";
  supplier: { id: string; name: string };
  items: PurchaseVariantResponse[];
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  deletedAt: string | null;
}

export interface UpdatePurchaseRequest {
  supplierId: string;
  purchaseDate: string;
  productName: string;
  categoryId: number;
  brand: string;
  gender?: ProductGender | null;
  invoiceUrl: string;
  variants: UpdatePurchaseVariantRequest[];
}

export interface UpdatePurchaseVariantRequest
  extends CreatePurchaseVariantRequest {
  /**
   * Solo existe para variantes persistidas pertenecientes a la compra.
   * Las filas creadas localmente durante la edición se envían sin `id`.
   */
  id?: string;
}

export interface PurchasesQuery {
  search?: string;
  page: number;
  limit: number;
}

export interface PurchasesPaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchasesTransportResult {
  data: PurchaseResponse[];
  metadata: PurchasesPaginationMetadata;
}

export interface CreatePurchaseVariantRequest {
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
}

export interface CreateNewProductPurchaseRequest {
  supplierId: string;
  purchaseDate: string;
  productName: string;
  categoryId: number;
  brand: string;
  gender: ProductGender | null;
  invoiceUrl: string;
  variants: CreatePurchaseVariantRequest[];
}

export interface RestockExistingVariantRequest {
  inventoryDetailId: string;
  quantity: number;
  unitCost: number;
}

export interface RestockNewVariantRequest {
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
}

export interface CreateRestockPurchaseRequest {
  supplierId: string;
  inventoryId: string;
  purchaseDate: string;
  invoiceUrl: string;
  existingVariants: RestockExistingVariantRequest[];
  newVariants: RestockNewVariantRequest[];
}

export interface InvoiceUploadResponse {
  invoiceUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface RestockInventoryOption {
  id: string;
  productName: string;
  sku: string;
}

export interface RestockPreviewResponse {
  inventory: {
    id: string;
    productName: string;
    brand: string;
    category: { id: string; name: string };
  };
  details: Array<{
    inventoryDetailId: string;
    sku: string;
    size: string;
    color: string;
    currentStock: number;
    currentUnitCost: number;
  }>;
}
