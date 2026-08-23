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

import type {
  ApiCart,
  ApiCartItem,
} from "@/types/cart/cart.types";

import type { Product, ProductVariant } from "@/types/products/product.types";



import {
  AUTH_SESSION_CHANGED_EVENT,
  readAccessToken,
} from "@/lib/auth-session";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;

  nombre: string;
  imagenUrl?: string | null;

  talla: string;
  color: string;
  colorHex: string;

  precio: number;
  descuentoLinea: number;
  totalLinea: number;

  stock: number;
  quantity: number;
}

export interface CartContextValue {
  // items: productos agregados actualmente al carrito.
  items: CartItem[];

  // addItem: agrega un producto o aumenta su cantidad sin superar stock.
addItem: (
  product: Product,
  variant: ProductVariant,
  quantity?: number,
) => Promise<void>;

  // removeItem: elimina un item del carrito por id de item.
  removeItem: (
    itemId: string,
  ) => Promise<void>;

  // updateQuantity: ajusta la cantidad y elimina si llega a cero.
  updateQuantity: (
    itemId: string,
    quantity: number,
  ) => Promise<void>;

  // clearCart: vacía todos los productos del carrito.
  clearCart: () => Promise<void>;

  // totalItems: suma total de unidades en el carrito.
  totalItems: number;

  // totalPrice: suma de los totales de las líneas.
  totalPrice: number;

  // isSyncing: indica si el carrito se está sincronizando con backend.
  isSyncing: boolean;

  // syncError: último error de sincronización u operación del carrito.
  syncError: string | null;

  // refreshCart: fuerza una sincronización del carrito actual.
  refreshCart: () => Promise<void>;
}

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

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

function apiCartItemToCartItem(
  item: ApiCartItem,
): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,

    nombre: item.productName,
    imagenUrl: item.imageUrl?.trim() || null,

    talla: item.variant.size,
    color: item.variant.colorName,
    colorHex: item.variant.colorHex,

    precio: normalizePrice(item.unitPrice),
    descuentoLinea: normalizePrice(
      item.lineDiscount,
    ),
    totalLinea: normalizePrice(
      item.lineTotal,
    ),

    stock: Math.max(
      0,
      item.availableStock,
    ),

    quantity: normalizeQuantity(
      item.quantity,
    ),
  };
}

function apiCartToCartItems(
  cart: ApiCart,
) {
  return (cart.items ?? []).map(
    apiCartItemToCartItem,
  );
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const [isSyncing, setIsSyncing] =
    useState(false);

  const [syncError, setSyncError] =
    useState<string | null>(null);

  const refreshPromiseRef =
    useRef<Promise<void> | null>(null);

  const refreshRequestIdRef =
    useRef(0);

  const isMountedRef =
    useRef(true);

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

  const applyCartState = useCallback(
    (cart: ApiCart) => {
      setItems(
        apiCartToCartItems(cart),
      );

      setSyncError(null);
    },
    [],
  );

  const refreshCart = useCallback(async () => {
    if (!readAccessToken()) {
      clearCartState();

      return;
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const requestId =
      refreshRequestIdRef.current + 1;

    refreshRequestIdRef.current =
      requestId;

    const syncPromise = (async () => {
      setIsSyncing(true);

      setSyncError(null);

      try {
        const cart =
          await getCurrentCart();

        if (
          isMountedRef.current &&
          refreshRequestIdRef.current ===
            requestId
        ) {
          applyCartState(cart);
        }
      } catch (error) {
        if (
          isMountedRef.current &&
          refreshRequestIdRef.current ===
            requestId
        ) {
          setSyncError(
            getCartErrorMessage(error),
          );
        }
      } finally {
        if (
          isMountedRef.current &&
          refreshRequestIdRef.current ===
            requestId
        ) {
          setIsSyncing(false);

          refreshPromiseRef.current =
            null;
        }
      }
    })();

    refreshPromiseRef.current =
      syncPromise;

    return syncPromise;
  }, [
    applyCartState,
    clearCartState,
  ]);

  const runCartOperation =
    useCallback(
      async (
        operation: () => Promise<ApiCart>,
      ) => {
        const tokenAtStart =
          readAccessToken();

        cancelPendingSync();

        setSyncError(null);

        try {
          const cart =
            await operation();

          if (
            readAccessToken() ===
            tokenAtStart
          ) {
            applyCartState(cart);
          }
        } catch (error) {
          setSyncError(
            getCartErrorMessage(error),
          );

          throw error;
        }
      },
      [
        applyCartState,
        cancelPendingSync,
      ],
    );

  useEffect(() => {
    const initialSyncTimeoutId =
      window.setTimeout(() => {
        void refreshCart();
      }, 0);

    const handleSessionChange = () => {
      void refreshCart();
    };

    window.addEventListener(
      AUTH_SESSION_CHANGED_EVENT,
      handleSessionChange,
    );

    window.addEventListener(
      "storage",
      handleSessionChange,
    );

    return () => {
      isMountedRef.current = false;

      window.clearTimeout(
        initialSyncTimeoutId,
      );

      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChange,
      );

      window.removeEventListener(
        "storage",
        handleSessionChange,
      );
    };
  }, [refreshCart]);

  const value =
    useMemo<CartContextValue>(() => {
const addItem = async (
  product: Product,
  variant: ProductVariant,
  quantity = 1,
) => {
  if (!variant.available) {
    return;
  }

  const stock = Math.max(
    0,
    variant.stock,
  );

  const currentItem = items.find(
    (item) =>
      item.variantId === variant.id,
  );

  const availableQuantity =
    stock -
    (currentItem?.quantity ?? 0);

  const quantityToAdd = Math.min(
    normalizeQuantity(quantity),
    availableQuantity,
  );

  if (
    stock === 0 ||
    quantityToAdd <= 0
  ) {
    return;
  }

  await runCartOperation(() =>
    addCartItem({
      variantId: variant.id,
      quantity: quantityToAdd,
    }),
  );
};

      const removeItem = async (
        itemId: string,
      ) => {
        await runCartOperation(() =>
          removeCartItem(itemId),
        );
      };

      const updateQuantity = async (
        itemId: string,
        quantity: number,
      ) => {
        const normalizedQuantity =
          normalizeQuantity(
            quantity,
          );

        if (
          normalizedQuantity === 0
        ) {
          await removeItem(itemId);

          return;
        }

        const currentItem =
          items.find(
            (item) =>
              item.id === itemId,
          );

        const safeQuantity =
          currentItem
            ? Math.min(
                normalizedQuantity,
                Math.max(
                  0,
                  currentItem.stock,
                ),
              )
            : normalizedQuantity;

        if (
          safeQuantity === 0
        ) {
          await removeItem(itemId);

          return;
        }

        await runCartOperation(() =>
          updateCartItemQuantity(
            itemId,
            {
              quantity:
                safeQuantity,
            },
          ),
        );
      };

      const clearCart =
        async () => {
          await runCartOperation(
            clearCurrentCart,
          );
        };

      const totalItems =
        items.reduce(
          (total, item) =>
            total +
            item.quantity,
          0,
        );

      const totalPrice =
        items.reduce(
          (total, item) =>
            total +
            item.totalLinea,
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
    }, [
      items,
      isSyncing,
      refreshCart,
      runCartOperation,
      syncError,
    ]);

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe usarse dentro de CartProvider",
    );
  }

  return context;
}