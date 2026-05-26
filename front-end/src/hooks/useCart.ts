"use client";

import { useMemo } from "react";
import {
  useCart as useCartContext,
  type CartItem,
} from "@/context/CartContext";
import type { Product } from "@/types/product";

export interface UseCartValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
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
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    ],
  );
}

export default useCart;