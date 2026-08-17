import type { PurchaseVariantValue } from "../components/form/VariantRow";
import type { ProductGender } from "./purchases.types";

export type ExistingInvoice = {
  name: string;
  mimeType: "image/png" | "image/jpeg" | "application/pdf";
  url: string;
};

export type EditablePurchase = {
  id: string;
  reference: string;
  date: string;
  supplierId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    brand?: string;
    gender?: ProductGender | null;
    variants: PurchaseVariantValue[];
  };
  existingInvoice: ExistingInvoice | null;
};
