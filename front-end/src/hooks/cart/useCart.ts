"use client";

import { useMemo } from "react";
import {
  useCart as useCartContext,
  type CartItem,
} from "@/contexts/CartContext";
import type { Product, ProductVariant } from "@/types/products/product.types";



export interface UseCartValue {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isSyncing: boolean;
  syncError: string | null;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartValue {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isSyncing,
    syncError,
    refreshCart,
  } = useCartContext();

  return useMemo(
    () => ({
      items,
      addToCart: addItem,
      removeFromCart: removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isSyncing,
      syncError,
      refreshCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isSyncing,
      syncError,
      refreshCart,
    ],
  );
}

export default useCart;
