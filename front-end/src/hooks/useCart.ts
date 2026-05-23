"use client";

import { useMemo } from "react";
import {
  useCart as useCartContext,
  type CartItem,
} from "@/context/CartContext";
import type { Product } from "@/types/product";

export interface UseCartValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
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