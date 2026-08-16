export const MAX_PRODUCT_IMAGES = 5;

export const MAX_PRODUCT_IMAGE_SIZE =
  5 * 1024 * 1024;

export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

export interface ProductImageValidationResult {
  valid: boolean;
  message?: string;
}

export function validateProductImage(
  file: File,
): ProductImageValidationResult {
  const allowedTypes: readonly string[] =
    ALLOWED_PRODUCT_IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message:
        "La imagen debe ser JPG, JPEG o PNG.",
    };
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return {
      valid: false,
      message:
        "La imagen no puede superar los 5 MB.",
    };
  }

  return {
    valid: true,
  };
}