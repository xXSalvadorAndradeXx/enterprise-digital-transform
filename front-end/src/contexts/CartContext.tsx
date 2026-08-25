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
  getCurrentCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/services/cart/cart.service";

import type {
  ApiCart,
  ApiCartItem,
} from "@/types/cart/cart.types";

import type {
  Product,
  ProductVariant,
} from "@/types/products/product.types";

import {
  AUTH_SESSION_CHANGED_EVENT,
  readAccessToken,
} from "@/lib/auth-session";

import {
  readCartToken,
} from "@/lib/cart-token";

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
  items: CartItem[];

  addItem: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
  ) => Promise<void>;

  removeItem: (
    itemId: string,
  ) => Promise<void>;

  updateQuantity: (
    itemId: string,
    quantity: number,
  ) => Promise<void>;

  totalItems: number;

  subtotal: number;
  discountTotal: number;
  total: number;

  isSyncing: boolean;
  syncError: string | null;

  refreshCart: () => Promise<void>;
}

type CartProviderProps = {
  children: ReactNode;
};

interface CartSnapshot {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
}

const CartContext = createContext<
  CartContextValue | undefined
>(undefined);

function normalizeQuantity(
  quantity: number,
) {
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(quantity),
  );
}

function normalizePrice(
  price: string | number | undefined,
) {
  return Number(price) || 0;
}

function getCartErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "No se pudo sincronizar el carrito.";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getCartErrorCode(
  error: unknown,
): string | null {
  if (!isRecord(error)) {
    return null;
  }

  const response = error.response;

  if (!isRecord(response)) {
    return null;
  }

  return typeof response.code === "string"
    ? response.code
    : null;
}

function apiCartItemToCartItem(
  item: ApiCartItem,
): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,

    nombre: item.productName,

    imagenUrl:
      item.imageUrl?.trim() || null,

    talla: item.variant.size,
    color: item.variant.colorName,
    colorHex: item.variant.colorHex,

    precio: normalizePrice(
      item.unitPrice,
    ),

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

function getProductGrossPrice(
  product: Product,
) {
  return normalizePrice(
    product.salePrice ??
      product.precio ??
      product.effectivePrice,
  );
}

function getProductEffectivePrice(
  product: Product,
) {
  return normalizePrice(
    product.effectivePrice ??
      product.salePrice ??
      product.precio,
  );
}

function createOptimisticItem(
  product: Product,
  variant: ProductVariant,
  quantity: number,
): CartItem {
  const unitPrice =
    getProductGrossPrice(product);

  const effectivePrice =
    getProductEffectivePrice(product);

  const unitDiscount = Math.max(
    0,
    unitPrice - effectivePrice,
  );

  return {
    id: `optimistic-${variant.id}`,

    productId:
      String(product.id),

    variantId:
      variant.id,

    nombre:
      product.commercialName ??
      product.nombre,

    imagenUrl:
      product.primaryImage?.url ??
      product.imagenUrl ??
      null,

    talla:
      variant.size,

    color:
      variant.color.name,

    colorHex:
      variant.color.hex,

    precio:
      unitPrice,

    descuentoLinea:
      unitDiscount * quantity,

    totalLinea:
      effectivePrice * quantity,

    stock:
      Math.max(
        0,
        variant.stock,
      ),

    quantity,
  };
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [subtotal, setSubtotal] =
    useState(0);

  const [
    discountTotal,
    setDiscountTotal,
  ] = useState(0);

  const [total, setTotal] =
    useState(0);

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

  const cancelPendingSync =
    useCallback(() => {
      refreshRequestIdRef.current += 1;

      refreshPromiseRef.current =
        null;
    }, []);

  const clearCartState =
    useCallback(() => {
      cancelPendingSync();

      setItems([]);
      setSubtotal(0);
      setDiscountTotal(0);
      setTotal(0);

      setIsSyncing(false);
      setSyncError(null);
    }, [
      cancelPendingSync,
    ]);

  const applyCartState =
    useCallback(
      (cart: ApiCart) => {
        setItems(
          apiCartToCartItems(
            cart,
          ),
        );

        setSubtotal(
          normalizePrice(
            cart.subtotal,
          ),
        );

        setDiscountTotal(
          normalizePrice(
            cart.discountTotal,
          ),
        );

        setTotal(
          normalizePrice(
            cart.total,
          ),
        );

        setSyncError(null);
      },
      [],
    );

  /*
   * Recupera el carrito actual.
   *
   * Puede hacerlo mediante:
   * - JWT
   * - X-Cart-Token
   *
   * Si no existe ninguno,
   * simplemente deja el carrito vacío.
   */
  const refreshCart =
    useCallback(async () => {
      const accessToken =
        readAccessToken();

      const cartToken =
        readCartToken();

      if (
        !accessToken &&
        !cartToken
      ) {
        clearCartState();
        return;
      }

      if (
        refreshPromiseRef.current
      ) {
        return refreshPromiseRef.current;
      }

      const requestId =
        refreshRequestIdRef.current +
        1;

      refreshRequestIdRef.current =
        requestId;

      const syncPromise =
        (async () => {
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
              applyCartState(
                cart,
              );
            }
          } catch (error) {
            if (
              isMountedRef.current &&
              refreshRequestIdRef.current ===
                requestId
            ) {
              setSyncError(
                getCartErrorMessage(
                  error,
                ),
              );
            }
          } finally {
            if (
              isMountedRef.current &&
              refreshRequestIdRef.current ===
                requestId
            ) {
              setIsSyncing(
                false,
              );

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

  /*
   * Combina carrito invitado después
   * de iniciar sesión.
   */
  const mergeCartAfterLogin =
    useCallback(async () => {
      const accessToken =
        readAccessToken();

      const cartToken =
        readCartToken();

      /*
       * Solo existe merge cuando tenemos
       * simultáneamente:
       *
       * - sesión
       * - carrito invitado
       */
      if (
        !accessToken ||
        !cartToken
      ) {
        await refreshCart();
        return;
      }

      cancelPendingSync();

      setIsSyncing(true);
      setSyncError(null);

      try {
        const mergedCart =
          await mergeGuestCart();

        if (
          isMountedRef.current
        ) {
          applyCartState(
            mergedCart,
          );
        }
      } catch (error) {
        if (
          !isMountedRef.current
        ) {
          return;
        }

        const code =
          getCartErrorCode(
            error,
          );

        /*
         * Si existe conflicto de stock:
         *
         * - NO borrar X-Cart-Token.
         * - informar al usuario.
         * - mantener disponible un
         *   reintento posterior.
         */
        if (
          code ===
          "STOCK_INSUFFICIENT"
        ) {
          setSyncError(
            getCartErrorMessage(
              error,
            ),
          );

          return;
        }

        setSyncError(
          getCartErrorMessage(
            error,
          ),
        );
      } finally {
        if (
          isMountedRef.current
        ) {
          setIsSyncing(false);
        }
      }
    }, [
      applyCartState,
      cancelPendingSync,
      refreshCart,
    ]);

  useEffect(() => {
    isMountedRef.current =
      true;

    /*
     * Al montar:
     *
     * - si existe JWT + carrito invitado:
     *   intentar merge.
     *
     * - si solo existe uno:
     *   recuperar carrito correspondiente.
     */
    const initialSyncTimeoutId =
      window.setTimeout(() => {
        const accessToken =
          readAccessToken();

        const cartToken =
          readCartToken();

        if (
          accessToken &&
          cartToken
        ) {
          void mergeCartAfterLogin();
          return;
        }

        void refreshCart();
      }, 0);

    /*
     * Después de Login/Logout,
     * volvemos a resolver el carrito.
     */
    const handleSessionChange =
      () => {
        const accessToken =
          readAccessToken();

        const cartToken =
          readCartToken();

        if (
          accessToken &&
          cartToken
        ) {
          void mergeCartAfterLogin();
          return;
        }

        void refreshCart();
      };

    /*
     * Si cambia localStorage,
     * recuperamos nuevamente el carrito.
     */
    const handleStorageChange =
      () => {
        void refreshCart();
      };

    window.addEventListener(
      AUTH_SESSION_CHANGED_EVENT,
      handleSessionChange,
    );

    window.addEventListener(
      "storage",
      handleStorageChange,
    );

    return () => {
      isMountedRef.current =
        false;

      window.clearTimeout(
        initialSyncTimeoutId,
      );

      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChange,
      );

      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
    };
  }, [
    mergeCartAfterLogin,
    refreshCart,
  ]);

  const value =
    useMemo<CartContextValue>(() => {
      const createSnapshot =
        (): CartSnapshot => ({
          items,
          subtotal,
          discountTotal,
          total,
        });

      const restoreSnapshot = (
        snapshot: CartSnapshot,
      ) => {
        setItems(
          snapshot.items,
        );

        setSubtotal(
          snapshot.subtotal,
        );

        setDiscountTotal(
          snapshot.discountTotal,
        );

        setTotal(
          snapshot.total,
        );
      };

      const runOptimisticOperation =
        async (
          applyOptimisticUpdate:
            () => void,

          operation:
            () => Promise<ApiCart>,
        ) => {
          const snapshot =
            createSnapshot();

          cancelPendingSync();

          setSyncError(null);
          setIsSyncing(true);

          applyOptimisticUpdate();

          try {
            const cart =
              await operation();

            applyCartState(
              cart,
            );
          } catch (error) {
            restoreSnapshot(
              snapshot,
            );

            setSyncError(
              getCartErrorMessage(
                error,
              ),
            );

            throw error;
          } finally {
            setIsSyncing(
              false,
            );
          }
        };

      /*
       * Agregar variante.
       */
      const addItem = async (
        product: Product,
        variant: ProductVariant,
        quantity = 1,
      ) => {
        if (
          !variant.available
        ) {
          return;
        }

        const stock =
          Math.max(
            0,
            variant.stock,
          );

        if (stock === 0) {
          return;
        }

        const normalizedQuantity =
          normalizeQuantity(
            quantity,
          );

        if (
          normalizedQuantity < 1
        ) {
          return;
        }

        const currentItem =
          items.find(
            (item) =>
              item.variantId ===
              variant.id,
          );

        const currentQuantity =
          currentItem?.quantity ??
          0;

        const availableQuantity =
          stock -
          currentQuantity;

        const quantityToAdd =
          Math.min(
            normalizedQuantity,
            availableQuantity,
          );

        if (
          quantityToAdd <= 0
        ) {
          return;
        }

        await runOptimisticOperation(
          () => {
            /*
             * Variante existente:
             * aumentar cantidad.
             */
            if (currentItem) {
              const oldQuantity =
                currentItem.quantity;

              const newQuantity =
                oldQuantity +
                quantityToAdd;

              const unitDiscount =
                oldQuantity > 0
                  ? currentItem
                      .descuentoLinea /
                    oldQuantity
                  : 0;

              const unitTotal =
                oldQuantity > 0
                  ? currentItem
                      .totalLinea /
                    oldQuantity
                  : currentItem
                      .precio;

              setItems(
                items.map(
                  (item) =>
                    item.variantId ===
                    variant.id
                      ? {
                          ...item,

                          quantity:
                            newQuantity,

                          descuentoLinea:
                            unitDiscount *
                            newQuantity,

                          totalLinea:
                            unitTotal *
                            newQuantity,
                        }
                      : item,
                ),
              );

              setSubtotal(
                subtotal +
                  currentItem.precio *
                    quantityToAdd,
              );

              setDiscountTotal(
                discountTotal +
                  unitDiscount *
                    quantityToAdd,
              );

              setTotal(
                total +
                  unitTotal *
                    quantityToAdd,
              );

              return;
            }

            /*
             * Nueva variante.
             */
            const optimisticItem =
              createOptimisticItem(
                product,
                variant,
                quantityToAdd,
              );

            setItems([
              ...items,
              optimisticItem,
            ]);

            setSubtotal(
              subtotal +
                optimisticItem.precio *
                  optimisticItem.quantity,
            );

            setDiscountTotal(
              discountTotal +
                optimisticItem
                  .descuentoLinea,
            );

            setTotal(
              total +
                optimisticItem
                  .totalLinea,
            );
          },

          () =>
            addCartItem({
              variantId:
                variant.id,

              quantity:
                quantityToAdd,
            }),
        );
      };

      /*
       * Eliminar una línea.
       */
      const removeItem =
        async (
          itemId: string,
        ) => {
          const currentItem =
            items.find(
              (item) =>
                item.id ===
                itemId,
            );

          if (!currentItem) {
            return;
          }

          await runOptimisticOperation(
            () => {
              setItems(
                items.filter(
                  (item) =>
                    item.id !==
                    itemId,
                ),
              );

              setSubtotal(
                Math.max(
                  0,
                  subtotal -
                    currentItem.precio *
                      currentItem.quantity,
                ),
              );

              setDiscountTotal(
                Math.max(
                  0,
                  discountTotal -
                    currentItem
                      .descuentoLinea,
                ),
              );

              setTotal(
                Math.max(
                  0,
                  total -
                    currentItem
                      .totalLinea,
                ),
              );
            },

            () =>
              removeCartItem(
                itemId,
              ),
          );
        };

      /*
       * Cambiar cantidad.
       */
      const updateQuantity =
        async (
          itemId: string,
          quantity: number,
        ) => {
          const currentItem =
            items.find(
              (item) =>
                item.id ===
                itemId,
            );

          if (!currentItem) {
            return;
          }

          const normalizedQuantity =
            normalizeQuantity(
              quantity,
            );

          const safeQuantity =
            Math.min(
              Math.max(
                1,
                normalizedQuantity,
              ),

              Math.max(
                1,
                currentItem.stock,
              ),
            );

          if (
            safeQuantity ===
            currentItem.quantity
          ) {
            return;
          }

          const oldQuantity =
            currentItem.quantity;

          const unitDiscount =
            oldQuantity > 0
              ? currentItem
                  .descuentoLinea /
                oldQuantity
              : 0;

          const unitTotal =
            oldQuantity > 0
              ? currentItem
                  .totalLinea /
                oldQuantity
              : currentItem.precio;

          const oldSubtotal =
            currentItem.precio *
            oldQuantity;

          const newSubtotal =
            currentItem.precio *
            safeQuantity;

          const oldDiscount =
            currentItem
              .descuentoLinea;

          const newDiscount =
            unitDiscount *
            safeQuantity;

          const oldTotal =
            currentItem.totalLinea;

          const newTotal =
            unitTotal *
            safeQuantity;

          await runOptimisticOperation(
            () => {
              setItems(
                items.map(
                  (item) =>
                    item.id ===
                    itemId
                      ? {
                          ...item,

                          quantity:
                            safeQuantity,

                          descuentoLinea:
                            newDiscount,

                          totalLinea:
                            newTotal,
                        }
                      : item,
                ),
              );

              setSubtotal(
                Math.max(
                  0,
                  subtotal -
                    oldSubtotal +
                    newSubtotal,
                ),
              );

              setDiscountTotal(
                Math.max(
                  0,
                  discountTotal -
                    oldDiscount +
                    newDiscount,
                ),
              );

              setTotal(
                Math.max(
                  0,
                  total -
                    oldTotal +
                    newTotal,
                ),
              );
            },

            () =>
              updateCartItemQuantity(
                itemId,
                {
                  quantity:
                    safeQuantity,
                },
              ),
          );
        };

      const totalItems =
        items.reduce(
          (
            accumulator,
            item,
          ) =>
            accumulator +
            item.quantity,
          0,
        );

      return {
        items,

        addItem,
        removeItem,
        updateQuantity,

        totalItems,

        subtotal,
        discountTotal,
        total,

        isSyncing,
        syncError,

        refreshCart,
      };
    }, [
      items,
      subtotal,
      discountTotal,
      total,
      isSyncing,
      syncError,
      refreshCart,
      applyCartState,
      cancelPendingSync,
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