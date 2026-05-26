"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  clearCurrentCart,
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/services/cart-service";
import type { ApiCart, ApiCartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import {
  AUTH_SESSION_CHANGED_EVENT,
  readAccessToken,
} from "@/lib/auth-session";

export interface CartItem {
  id: number;
  productId: number;
  nombre: string;
  precio: number;
  imagenUrl?: string | null;
  stock: number;
  quantity: number;
  subtotal: number;
}

export interface CartContextValue {
  // items: productos agregados actualmente al carrito.
  items: CartItem[];
  // addItem: agrega un producto o aumenta su cantidad sin superar stock.
  addItem: (product: Product, quantity?: number) => Promise<void>;
  // removeItem: elimina un item del carrito por id de item.
  removeItem: (itemId: number) => Promise<void>;
  // updateQuantity: ajusta la cantidad y elimina si llega a cero.
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  // clearCart: vacia todos los productos del carrito.
  clearCart: () => Promise<void>;
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

function normalizePrice(price: string | number) {
  return Number(price) || 0;
}

function apiCartItemToCartItem(item: ApiCartItem): CartItem {
  const product = item.product;
  const quantity = normalizeQuantity(item.quantity);
  const precio = normalizePrice(item.unitPrice) || normalizePrice(product.precio);

  return {
    id: item.id,
    productId: product.id,
    nombre: product.nombre,
    precio,
    imagenUrl: product.imagenUrl.trim() || null,
    stock: Math.max(0, product.stock),
    quantity,
    subtotal: normalizePrice(item.subtotal) || precio * quantity,
  };
}

function apiCartToCartItems(cart: ApiCart) {
  return (cart.items ?? []).map(apiCartItemToCartItem);
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const syncCart = async () => {
      if (!readAccessToken()) {
        if (isMounted) {
          setItems([]);
        }
        return;
      }

      try {
        const cart = await getCurrentCart();

        if (isMounted) {
          setItems(apiCartToCartItems(cart));
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      }
    };

    void syncCart();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const addItem = async (product: Product, quantity = 1) => {
      const stock = Math.max(0, product.stock);
      const currentItem = items.find((item) => item.productId === product.id);
      const availableQuantity = stock - (currentItem?.quantity ?? 0);
      const quantityToAdd = Math.min(
        normalizeQuantity(quantity),
        availableQuantity,
      );

      if (stock === 0 || quantityToAdd <= 0) {
        return;
      }

      const cart = await addCartItem({
        productId: product.id,
        quantity: quantityToAdd,
      });

      setItems(apiCartToCartItems(cart));
    };

    const removeItem = async (itemId: number) => {
      const cart = await removeCartItem(itemId);

      setItems(apiCartToCartItems(cart));
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
      const normalizedQuantity = normalizeQuantity(quantity);

      if (normalizedQuantity === 0) {
        await removeItem(itemId);
        return;
      }

      const currentItem = items.find((item) => item.id === itemId);
      const safeQuantity = currentItem
        ? Math.min(normalizedQuantity, Math.max(0, currentItem.stock))
        : normalizedQuantity;

      if (safeQuantity === 0) {
        await removeItem(itemId);
        return;
      }

      const cart = await updateCartItemQuantity(itemId, {
        quantity: safeQuantity,
      });

      setItems(apiCartToCartItems(cart));
    };

    const clearCart = async () => {
      const cart = await clearCurrentCart();

      setItems(apiCartToCartItems(cart));
    };

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce(
      (total, item) => total + item.subtotal,
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