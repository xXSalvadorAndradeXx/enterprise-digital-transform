"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

/* =========================
   Interfaces
========================= */

export interface CartItem {

  id: string;

  name: string;

  price: number;

  image: string;

  quantity: number;

}

interface CartContextType {

  cartItems: CartItem[];

  addToCart: (
    product: CartItem
  ) => void;

  removeFromCart: (
    id: string
  ) => void;

  updateQuantity: (
    id: string,
    quantity: number
  ) => void;

  clearCart: () => void;

}

/* =========================
   Context
========================= */

export const CartContext =
  createContext<CartContextType | null>(
    null
  );

/* =========================
   Provider
========================= */

interface CartProviderProps {

  children: ReactNode;

}

export function CartProvider({
  children,
}: CartProviderProps) {

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  /* =========================
     Agregar producto
  ========================= */

  const addToCart = (
    product: CartItem
  ) => {

    setCartItems((prev) => {

      const existingProduct =
        prev.find(
          (item) =>
            item.id === product.id
        );

      // Si ya existe
      if (existingProduct) {

        return prev.map((item) =>

          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item

        );

      }

      // Nuevo producto
      return [...prev, product];

    });

  };

  /* =========================
     Eliminar producto
  ========================= */

  const removeFromCart = (
    id: string
  ) => {

    setCartItems((prev) =>

      prev.filter(
        (item) => item.id !== id
      )

    );

  };

  /* =========================
     Actualizar cantidad
  ========================= */

  const updateQuantity = (
    id: string,
    quantity: number
  ) => {

    setCartItems((prev) =>

      prev.map((item) =>

        item.id === id
          ? {
              ...item,
              quantity,
            }
          : item

      )

    );

  };

  /* =========================
     Vaciar carrito
  ========================= */

  const clearCart = () => {

    setCartItems([]);

  };

  return (

    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >

      {children}

    </CartContext.Provider>

  );

}

/* =========================
   Hook personalizado
========================= */

export function useCart() {

  const context =
    useContext(CartContext);

  if (!context) {

    throw new Error(
      "useCart debe usarse dentro de CartProvider"
    );

  }

  return context;

}