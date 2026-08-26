import type {
  ProductFormSchema,
} from "./schemas";

import type {
  ProductVariantConfig,
} from "./product-variant.types";

export interface PendingProductSubmission {
  values: ProductFormSchema;
  files: File[];
  variantConfigs: ProductVariantConfig[];
}
