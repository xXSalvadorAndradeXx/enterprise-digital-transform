import type { CheckoutItem } from "@/types/checkout/checkout.types";

const BUY_NOW_STORAGE_KEY = "woden_buy_now";

export interface BuyNowSelection {
  item: CheckoutItem;
  productName: string;
  unitPrice: number;
  originalUnitPrice: number;
}

export function readBuyNowSelection(): BuyNowSelection | null {
  if (typeof window === "undefined") return null;

  try {
    const value = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    if (!value) return null;

    const selection = JSON.parse(value) as BuyNowSelection;
    if (
      !selection.item?.variantId ||
      selection.item.quantity < 1 ||
      !Number.isFinite(selection.unitPrice)
    ) {
      return null;
    }

    return selection;
  } catch {
    return null;
  }
}

export function saveBuyNowSelection(selection: BuyNowSelection): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(selection));
}

export function clearBuyNowSelection(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
}
