"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  clearCurrentCart,
  getCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/services/cart/cart.service";
import type { ApiCart, ApiCartItem } from "@/types/cart/cart.types";
import type { Product } from "@/types/products/product.types";
import {
  AUTH_SESSION_CHANGED_EVENT,
  readAccessToken,
} from "@/lib/auth-session";

export interface CartItem {
  id: number;
  productId: string | number;
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
  // isSyncing: indica si el carrito se esta sincronizando con backend.
  isSyncing: boolean;
  // syncError: ultimo error de sincronizacion u operacion del carrito.
  syncError: string | null;
  // refreshCart: fuerza una sincronizacion del carrito actual.
  refreshCart: () => Promise<void>;
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

function getCartErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo sincronizar el carrito.";
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const refreshRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const cancelPendingSync = useCallback(() => {
    refreshRequestIdRef.current += 1;
    refreshPromiseRef.current = null;
    setIsSyncing(false);
  }, []);

  const clearCartState = useCallback(() => {
    cancelPendingSync();
    setItems([]);
    setSyncError(null);
  }, [cancelPendingSync]);

  const applyCartState = useCallback((cart: ApiCart) => {
    setItems(apiCartToCartItems(cart));
    setSyncError(null);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!readAccessToken()) {
      clearCartState();
      return;
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;

    const syncPromise = (async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const cart = await getCurrentCart();

        if (isMountedRef.current && refreshRequestIdRef.current === requestId) {
          applyCartState(cart);
        }
      } catch (error) {
        if (isMountedRef.current && refreshRequestIdRef.current === requestId) {
          setSyncError(getCartErrorMessage(error));
        }
      } finally {
        if (isMountedRef.current && refreshRequestIdRef.current === requestId) {
          setIsSyncing(false);
          refreshPromiseRef.current = null;
        }
      }
    })();

    refreshPromiseRef.current = syncPromise;
    return syncPromise;
  }, [applyCartState, clearCartState]);

  const runCartOperation = useCallback(
    async (operation: () => Promise<ApiCart>) => {
      const tokenAtStart = readAccessToken();

      cancelPendingSync();
      setSyncError(null);

      try {
        const cart = await operation();

        if (readAccessToken() === tokenAtStart) {
          applyCartState(cart);
        }
      } catch (error) {
        setSyncError(getCartErrorMessage(error));
        throw error;
      }
    },
    [applyCartState, cancelPendingSync],
  );

  useEffect(() => {
    const initialSyncTimeoutId = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    const handleSessionChange = () => {
      void refreshCart();
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(initialSyncTimeoutId);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, [refreshCart]);

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

      await runCartOperation(() =>
        addCartItem({
          productId: product.id,
          quantity: quantityToAdd,
        }),
      );
    };

    const removeItem = async (itemId: number) => {
      await runCartOperation(() => removeCartItem(itemId));
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

      await runCartOperation(() =>
        updateCartItemQuantity(itemId, {
          quantity: safeQuantity,
        }),
      );
    };

    const clearCart = async () => {
      await runCartOperation(clearCurrentCart);
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
      isSyncing,
      syncError,
      refreshCart,
    };
  }, [items, isSyncing, refreshCart, runCartOperation, syncError]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}

