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
  data: readonly unknown[];
  metadata: PurchasesPaginationMetadata;
}
