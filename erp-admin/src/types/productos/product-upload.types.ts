export interface ProductImageUploadData {
  imageUrl: string;
  fileName: string;
  sizeBytes: number;
}

export interface ProductImageUploadResponse {
  data: ProductImageUploadData;
  statusCode: 201;
}