"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types/product";

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl?: string | null;
  stock: number;
  quantity: number;
}

export interface CartContextValue {
  // items: productos agregados actualmente al carrito.
  items: CartItem[];
  // addItem: agrega un producto o aumenta su cantidad sin superar stock.
  addItem: (product: Product, quantity?: number) => void;
  // removeItem: elimina un producto del carrito por id.
  removeItem: (productId: number) => void;
  // updateQuantity: ajusta la cantidad y elimina si llega a cero.
  updateQuantity: (productId: number, quantity: number) => void;
  // clearCart: vacia todos los productos del carrito.
  clearCart: () => void;
  // totalItems: suma total de unidades en el carrito.
  totalItems: number;
  // totalPrice: suma de precio por cantidad de todos los items.
  totalPrice: number;
}

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity));
}

function productToCartItem(product: Product, quantity: number): CartItem {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: Number(product.precio) || 0,
    imagenUrl: product.imagenUrl.trim() || null,
    stock: Math.max(0, product.stock),
    quantity,
  };
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      const stock = Math.max(0, product.stock);
      const quantityToAdd = Math.min(normalizeQuantity(quantity), stock);

      if (stock === 0 || quantityToAdd === 0) {
        return;
      }

      setItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (!existingItem) {
          return [...currentItems, productToCartItem(product, quantityToAdd)];
        }

        return currentItems.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(item.quantity + quantityToAdd, stock),
            stock,
          };
        });
      });
    };

    const removeItem = (productId: number) => {
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== productId),
      );
    };

    const updateQuantity = (productId: number, quantity: number) => {
      const normalizedQuantity = normalizeQuantity(quantity);

      setItems((currentItems) => {
        if (normalizedQuantity === 0) {
          return currentItems.filter((item) => item.id !== productId);
        }

        return currentItems
          .map((item) => {
            if (item.id !== productId) {
              return item;
            }

            const stock = Math.max(0, item.stock);

            return {
              ...item,
              quantity: Math.min(normalizedQuantity, stock),
            };
          })
          .filter((item) => item.quantity > 0);
      });
    };

    const clearCart = () => {
      setItems([]);
    };

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce(
      (total, item) => total + item.precio * item.quantity,
      0,
    );

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}