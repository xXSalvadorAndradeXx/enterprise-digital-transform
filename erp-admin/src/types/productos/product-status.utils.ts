import type {
  ProductStatus,
} from "./product.types";

export function canActivateProduct(
  currentStatus: ProductStatus,
): boolean {
  return (
    currentStatus !==
    "DISCONTINUED"
  );
}

export function canPauseProduct(
  currentStatus: ProductStatus,
): boolean {
  return (
    currentStatus ===
    "ACTIVE"
  );
}

export function canDiscontinueProduct(
  currentStatus: ProductStatus,
): boolean {
  return (
    currentStatus !==
    "DISCONTINUED"
  );
}