import type {
  ProductFormSchema,
} from "./schemas";

export interface PendingProductSubmission {
  values: ProductFormSchema;
  files: File[];
}