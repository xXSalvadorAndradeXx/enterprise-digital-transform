import type { PurchaseVariantValue } from "../components/form/VariantRow";

export type PurchaseEditSnapshot = {
  date: string;
  supplierId: string;
  productId: string;
  productName: string;
  categoryId: string;
  variants: PurchaseVariantValue[];
};

export type VariantChanges = {
  added: PurchaseVariantValue[];
  updated: PurchaseVariantValue[];
  removed: string[];
};

export type PurchaseChangedFields = {
  date?: string;
  supplierId?: string;
  productId?: string;
  productName?: string;
  categoryId?: string;
  variants?: VariantChanges;
  replacementInvoice?: File;
};

export type PurchaseChanges = {
  hasChanges: boolean;
  changedFields: PurchaseChangedFields;
};

function variantValuesDiffer(
  original: PurchaseVariantValue,
  current: PurchaseVariantValue,
): boolean {
  return (
    original.size.trim() !== current.size.trim() ||
    original.quantity.trim() !== current.quantity.trim() ||
    original.unitCost.trim() !== current.unitCost.trim()
  );
}

export function getPurchaseChanges(
  original: PurchaseEditSnapshot,
  current: PurchaseEditSnapshot,
  replacementInvoice: File | null,
): PurchaseChanges {
  const changedFields: PurchaseChangedFields = {};

  if (original.date !== current.date) changedFields.date = current.date;
  if (original.supplierId !== current.supplierId) {
    changedFields.supplierId = current.supplierId;
  }
  if (original.productId !== current.productId) {
    changedFields.productId = current.productId;
  }
  if (original.productName.trim() !== current.productName.trim()) {
    changedFields.productName = current.productName.trim();
  }
  if (original.categoryId !== current.categoryId) {
    changedFields.categoryId = current.categoryId;
  }

  const originalById = new Map(
    original.variants.map((variant) => [variant.id, variant]),
  );
  const currentById = new Map(
    current.variants.map((variant) => [variant.id, variant]),
  );
  const added = current.variants
    .filter((variant) => !originalById.has(variant.id))
    .map((variant) => ({ ...variant }));
  const removed = original.variants
    .filter((variant) => !currentById.has(variant.id))
    .map((variant) => variant.id);
  const updated = current.variants
    .filter((variant) => {
      const originalVariant = originalById.get(variant.id);
      return originalVariant
        ? variantValuesDiffer(originalVariant, variant)
        : false;
    })
    .map((variant) => ({ ...variant }));

  if (added.length > 0 || updated.length > 0 || removed.length > 0) {
    changedFields.variants = { added, updated, removed };
  }
  if (replacementInvoice) {
    changedFields.replacementInvoice = replacementInvoice;
  }

  return {
    hasChanges: Object.keys(changedFields).length > 0,
    changedFields,
  };
}
