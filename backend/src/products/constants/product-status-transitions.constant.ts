import { ProductStatus } from '../enums/product-status.enum';

export const PRODUCT_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.DRAFT]: [ProductStatus.ACTIVE],
  [ProductStatus.ACTIVE]: [ProductStatus.PAUSED, ProductStatus.DISCONTINUED],
  [ProductStatus.PAUSED]: [ProductStatus.ACTIVE, ProductStatus.DISCONTINUED],
  [ProductStatus.DISCONTINUED]: [],
};
