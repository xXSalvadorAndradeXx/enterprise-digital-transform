"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/hooks/cart/useCart";
import { saveBuyNowSelection } from "@/lib/buy-now";
import { apiRequest } from "@/lib/api-client";
import { hasActiveSession } from "@/lib/auth-session";
import {
  addFavorite,
  checkFavorite,
  removeFavorite,
} from "@/services/favorites/favorites.service";

import CartNotification from "@/components/cart/CartNotification";
import BuyNowVariantModal from "@/components/products/BuyNowVariantModal";

import type {
  Product,
  ProductImage,
  ProductVariant,
} from "@/types/products/product.types";

type ProductCardProps = {
  product: Product;
  variant?: "default" | "favorite";
  isFavorite?: boolean;
  isFavoritePending?: boolean;
  onFavoriteToggle?: (
    nextFavorite: boolean,
    product: Product,
  ) => void | Promise<void>;
  showViewProductAction?: boolean;
  addToCartLabel?: string;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatProductPrice(price: Product["precio"]) {
  const normalizedPrice =
    typeof price === "string"
      ? price.trim()
      : price;

  const numericPrice =
    normalizedPrice === ""
      ? Number.NaN
      : Number(normalizedPrice);

  if (Number.isFinite(numericPrice)) {
    return priceFormatter.format(numericPrice);
  }

  return String(price);
}

function unwrapProductDetail(
  payload: unknown,
): Product | null {
  let current = payload;

  for (let depth = 0; depth < 3; depth += 1) {
    if (
      current &&
      typeof current === "object" &&
      "id" in current
    ) {
      return current as Product;
    }

    if (
      current &&
      typeof current === "object" &&
      "data" in current
    ) {
      current = (
        current as {
          data?: unknown;
        }
      ).data;

      continue;
    }

    break;
  }

  return null;
}

function normalizeProductVariants(
  product: Product,
): ProductVariant[] {
  const rawVariants = (
    product.variants ?? []
  ) as unknown as Array<{
    id?: string;
    sku?: string;
    size?: string;
    color?:
      | string
      | {
          name?: string;
          hex?: string;
        };
    stock?: number | string;
    available?: boolean;
    stockStatus?: string;
  }>;

  return rawVariants.flatMap(
    (variant, index) => {
      const rawColor = variant.color;

      const hex =
        typeof rawColor === "string"
          ? rawColor.trim()
          : String(rawColor?.hex ?? "").trim();

      const size = String(
        variant.size ?? "",
      ).trim();

      const variantStock = Number(
        variant.stock ?? 0,
      );

      if (
        !variant.id ||
        !size ||
        !hex ||
        variantStock <= 0 ||
        variant.stockStatus === "OUT_OF_STOCK" ||
        variant.available === false
      ) {
        return [];
      }

      return [
        {
          id: String(variant.id),
          sku: String(
            variant.sku ??
              variant.id ??
              index,
          ),
          size,
          color: {
            name:
              typeof rawColor === "string"
                ? rawColor
                : String(
                    rawColor?.name ??
                      hex,
                  ),
            hex,
          },
          stock: variantStock,
          available: true,
        },
      ];
    },
  );
}

export default function ProductCard({
  product,
  variant = "default",
  isFavorite,
  isFavoritePending = false,
  onFavoriteToggle,
  showViewProductAction = false,
  addToCartLabel = "Añadir al Carrito",
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const isFavoriteVariant =
    variant === "favorite";

  const [failedImageUrl, setFailedImageUrl] =
    useState("");

  const [favorite, setFavorite] =
    useState(false);

  const [isAdding, setIsAdding] =
    useState(false);

  const [
    isUpdatingFavorite,
    setIsUpdatingFavorite,
  ] = useState(false);

  const [cartError, setCartError] =
    useState("");

  const [cartSuccess, setCartSuccess] =
    useState("");

  const [
    showBuyNowModal,
    setShowBuyNowModal,
  ] = useState(false);

  const [
    showAddToCartModal,
    setShowAddToCartModal,
  ] = useState(false);

  const [cartProduct, setCartProduct] =
    useState<Product | null>(null);

  const [cartVariants, setCartVariants] =
    useState<ProductVariant[]>([]);

  const [
    isLoadingCartProduct,
    setIsLoadingCartProduct,
  ] = useState(false);

  const backendProduct = product as Product & {
    inventory?: {
      productName?: string;
      brand?: string;
      stock?: string | number;
      totalStock?: number;
      category?: {
        id: number;
        name?: string;
        nombre?: string;
      } | null;
    };
    images?: Array<
      string |
        (ProductImage & {
          imageUrl?: string;
        })
    >;
  };

  const name =
    product.commercialName ??
    product.nombre ??
    backendProduct.inventory?.productName ??
    "Producto";

  const primaryImageUrl =
    typeof product.primaryImage === "string"
      ? product.primaryImage
      : product.primaryImage?.url;

  const firstBackendImage =
    backendProduct.images?.[0];

  const firstBackendImageUrl =
    typeof firstBackendImage === "string"
      ? firstBackendImage
      : firstBackendImage?.url ??
        firstBackendImage?.imageUrl;

  const imageUrl = (
    primaryImageUrl ??
    firstBackendImageUrl ??
    product.imagenUrl ??
    ""
  ).trim();

  const stock = Number(
    product.stockTotal ??
      product.stock ??
      backendProduct.inventory?.totalStock ??
      backendProduct.inventory?.stock ??
      0,
  );

  const currentPrice =
    product.effectivePrice ??
    product.precio;

  const originalPrice =
    product.salePrice;

  const rawDiscount =
    product.discount as unknown;

  const discountPercentage =
    typeof rawDiscount === "number"
      ? rawDiscount
      : rawDiscount &&
          typeof rawDiscount === "object" &&
          "percentage" in rawDiscount
        ? Number(
            (
              rawDiscount as {
                percentage?: number;
              }
            ).percentage ?? 0,
          )
        : 0;

  const hasActiveDiscount =
    discountPercentage > 0 &&
    Number(currentPrice) <
      Number(
        originalPrice ??
          currentPrice,
      );

  const brand =
    product.brand ??
    backendProduct.inventory?.brand ??
    "Woden";

  const isAvailable =
    product.availability
      ? product.availability !==
        "OUT_OF_STOCK"
      : stock > 0;

  const shouldShowImage =
    imageUrl.length > 0 &&
    failedImageUrl !== imageUrl;

  const detailHref =
    `/producto/${product.id}`;

  const availableVariants =
    normalizeProductVariants(product);

  const firstAvailableVariant =
    availableVariants[0];

  const isFavoriteControlled =
    isFavorite !== undefined;

  const favoriteMarked =
    isFavorite ?? favorite;

  const favoriteActionDisabled =
    isFavoritePending ||
    isUpdatingFavorite;

  useEffect(() => {
    if (isFavoriteControlled) {
      return;
    }

    if (hasActiveSession()) {
      const controller = new AbortController();

      void checkFavorite(String(product.id), controller.signal).then(
        setFavorite,
        () => undefined,
      );

      return () => controller.abort();
    }

    const timer = window.setTimeout(() => {
      try {
        const values = JSON.parse(
          localStorage.getItem(
            "woden-wishlist",
          ) ?? "[]",
        ) as Array<string | number>;

        setFavorite(
          values
            .map(String)
            .includes(
              String(product.id),
            ),
        );
      } catch {}
    }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [
    isFavoriteControlled,
    product.id,
  ]);

  const toggleFavorite = async () => {
    if (favoriteActionDisabled) {
      return;
    }

    const next = !favoriteMarked;

    if (onFavoriteToggle) {
      setIsUpdatingFavorite(true);

      try {
        await onFavoriteToggle(
          next,
          product,
        );

        if (!isFavoriteControlled) {
          setFavorite(next);
        }
      } finally {
        setIsUpdatingFavorite(false);
      }

      return;
    }

    if (hasActiveSession()) {
      setIsUpdatingFavorite(true);

      try {
        if (next) {
          await addFavorite(String(product.id));
        } else {
          await removeFavorite(String(product.id));
        }

        setFavorite(next);
      } catch {
        setCartError(
          next
            ? "No se pudo agregar el producto a favoritos. Intenta nuevamente."
            : "No se pudo quitar el producto de favoritos. Intenta nuevamente.",
        );
      } finally {
        setIsUpdatingFavorite(false);
      }

      return;
    }

    setFavorite(next);

    try {
      const values = JSON.parse(
        localStorage.getItem(
          "woden-wishlist",
        ) ?? "[]",
      ) as Array<string | number>;

      const ids = new Set(
        values.map(String),
      );

      if (next) {
        ids.add(String(product.id));
      } else {
        ids.delete(String(product.id));
      }

      localStorage.setItem(
        "woden-wishlist",
        JSON.stringify([...ids]),
      );
    } catch {}
  };

  const handleQuickAdd = async () => {
    if (
      isAdding ||
      isLoadingCartProduct
    ) {
      return;
    }

    setCartError("");
    setCartSuccess("");

    /*
     * En Favoritos necesitamos consultar
     * el detalle completo porque el listado
     * no incluye las variantes.
     */
    if (showViewProductAction) {
      setIsLoadingCartProduct(true);

      try {
        const payload =
          await apiRequest<unknown>(
            `/ecommerce/products/${encodeURIComponent(
              String(product.id),
            )}`,
          );

        const detailedProduct =
          unwrapProductDetail(payload);

        if (!detailedProduct) {
          throw new Error(
            "No se pudo cargar el detalle del producto.",
          );
        }

        const detailedVariants =
          normalizeProductVariants(
            detailedProduct,
          );

        if (
          detailedVariants.length === 0
        ) {
          throw new Error(
            "Este producto no tiene variantes disponibles para agregar al carrito.",
          );
        }

        setCartProduct(
          detailedProduct,
        );

        setCartVariants(
          detailedVariants,
        );

        setShowAddToCartModal(true);
      } catch (error) {
        setCartError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el producto.",
        );
      } finally {
        setIsLoadingCartProduct(false);
      }

      return;
    }

    /*
     * Se conserva el comportamiento actual
     * de las tarjetas normales del catálogo.
     */
    if (!firstAvailableVariant) {
      router.push(detailHref);
      return;
    }

    setIsAdding(true);

    try {
      await addToCart(
        product,
        firstAvailableVariant,
        1,
      );
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto al carrito.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const confirmAddToCart = async (
    variant: ProductVariant,
    quantity: number,
  ) => {
    if (
      !cartProduct ||
      isAdding
    ) {
      return;
    }

    setCartError("");
    setCartSuccess("");
    setIsAdding(true);

    try {
      await addToCart(
        cartProduct,
        variant,
        quantity,
      );

      setShowAddToCartModal(false);

      setCartSuccess(
        "Producto añadido al carrito correctamente.",
      );
    } catch (error) {
      /*
       * Cerramos el modal para que el error
       * quede visible en la tarjeta.
       */
      setShowAddToCartModal(false);

      setCartError(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto al carrito.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (
      availableVariants.length === 0
    ) {
      router.push(detailHref);
      return;
    }

    setShowBuyNowModal(true);
  };

  const confirmBuyNow = (
    variant: ProductVariant,
    quantity: number,
  ) => {
    const unitPrice =
      Number(currentPrice);

    const originalUnitPrice =
      Number(
        originalPrice ??
          currentPrice,
      );

    saveBuyNowSelection({
      item: {
        variantId: variant.id,
        quantity,
        priceAtAdded:
          Number.isFinite(unitPrice)
            ? unitPrice.toFixed(2)
            : undefined,
      },
      productName: name,
      unitPrice:
        Number.isFinite(unitPrice)
          ? unitPrice
          : 0,
      originalUnitPrice:
        Number.isFinite(
          originalUnitPrice,
        )
          ? originalUnitPrice
          : unitPrice,
    });

    setShowBuyNowModal(false);

    router.push(
      "/checkout?source=buy-now",
    );
  };

  return (
    <article
      className={
        isFavoriteVariant
          ? "group flex h-full w-full max-w-[236px] cursor-pointer flex-col overflow-hidden rounded-lg border border-[#E4E6EC] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition hover:shadow-md sm:w-[224px]"
          : "group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-[#e0e3e8] bg-white p-4 transition hover:shadow-lg"
      }
      role="link"
      tabIndex={0}
      onClick={(event) => {
        if (
          !(
            event.target as HTMLElement
          ).closest("a,button")
        ) {
          router.push(detailHref);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          router.push(detailHref);
        }
      }}
      aria-label={`Ver detalle de ${name}`}
    >
      <div
        className={
          isFavoriteVariant
            ? "relative aspect-square overflow-hidden rounded-md bg-[#F5F6F8]"
            : "relative aspect-[16/10] overflow-hidden bg-[#F4F7FB]"
        }
      >
        {hasActiveDiscount &&
        !isFavoriteVariant ? (
          <span className="absolute left-2 top-2 z-10 rounded bg-[#ff3b30] px-2 py-1 text-xs font-bold text-white">
            -{discountPercentage}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={() =>
            void toggleFavorite()
          }
          disabled={
            favoriteActionDisabled
          }
          aria-pressed={
            favoriteMarked
          }
          aria-label={
            favoriteMarked
              ? "Quitar de favoritos"
              : "Agregar a favoritos"
          }
          className={`absolute right-2 top-2 z-10 rounded-full bg-white shadow ${
            isFavoriteVariant
              ? "flex h-8 w-8 items-center justify-center p-0 ring-1 ring-black/5"
              : "p-2"
          } ${
            favoriteActionDisabled
              ? "cursor-wait opacity-70"
              : ""
          }`}
        >
          <Heart
            className={`h-4 w-4 ${
              favoriteMarked
                ? "fill-red-500 text-red-500"
                : ""
            }`}
          />
        </button>

        {shouldShowImage ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes={
              isFavoriteVariant
                ? "(max-width: 640px) 236px, 224px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            }
            className={
              isFavoriteVariant
                ? "object-contain p-4"
                : "object-cover transition-transform duration-500 group-hover:scale-105"
            }
            onError={() =>
              setFailedImageUrl(
                imageUrl,
              )
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAF3FF] to-[#F4F7FB] px-6 text-center">
            <span className="rounded-full border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              Sin imagen
            </span>
          </div>
        )}

        {!isAvailable ? (
          <div
            className="absolute inset-0 z-[5] flex items-center justify-center bg-black/35"
            aria-label={`${name} agotado`}
          >
            <span className="rounded-md bg-black/80 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg">
              Agotado
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={
          isFavoriteVariant
            ? "flex flex-1 flex-col pt-3"
            : "flex flex-1 flex-col pt-4"
        }
      >
        <div
          className={
            isFavoriteVariant
              ? "min-w-0"
              : "flex flex-wrap items-start justify-between gap-2.5"
          }
        >
          <div className="min-w-0 flex-1">
            <p
              className={
                isFavoriteVariant
                  ? "hidden"
                  : "text-base font-bold uppercase leading-5"
              }
            >
              {brand}
            </p>

            <h3
              className={
                isFavoriteVariant
                  ? "line-clamp-2 min-h-10 text-[15px] font-semibold leading-5 text-[#111111]"
                  : "line-clamp-2 text-sm font-semibold leading-5 text-[#111111]"
              }
            >
              {name}
            </h3>
          </div>

          {!isFavoriteVariant ? (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                isAvailable
                  ? "border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]"
                  : "border border-[#D9E2EC] bg-[#F4F7FB] text-slate-500"
              }`}
            >
              {isAvailable
                ? "Disponible"
                : "Agotado"}
            </span>
          ) : null}
        </div>

        <div
          className={
            isFavoriteVariant
              ? "mt-auto grid gap-3 pt-1"
              : "mt-auto grid gap-3 pt-3"
          }
        >
          <div className="min-w-0">
            <p
              className={
                isFavoriteVariant
                  ? "hidden"
                  : "text-xs font-semibold uppercase text-slate-500"
              }
            >
              Precio
            </p>

            <p
              className={
                isFavoriteVariant
                  ? "mt-1 truncate text-sm font-semibold text-[#555555]"
                  : `mt-0.5 truncate text-xl font-extrabold ${
                      hasActiveDiscount
                        ? "text-[#ff2d20]"
                        : "text-[#111111]"
                    }`
              }
            >
              {formatProductPrice(
                currentPrice,
              )}
            </p>

            {hasActiveDiscount &&
            originalPrice &&
            !isFavoriteVariant ? (
              <p className="text-sm text-slate-500 line-through">
                {formatProductPrice(
                  originalPrice,
                )}
              </p>
            ) : null}

            <p
              className={
                isFavoriteVariant
                  ? "hidden"
                  : "mt-1 text-xs font-medium text-slate-500"
              }
            >
              <span className={isAvailable ? "text-green-600" : "text-red-500"}>
                ●
              </span>{" "}
              {isAvailable ? `${stock} unidades disponibles` : "Agotado"}
            </p>
          </div>

          {showViewProductAction ? (
            <div
              className={
                isFavoriteVariant
                  ? "grid grid-cols-[1fr_40px] gap-2"
                  : "grid gap-2"
              }
            >
              <Link
                href={detailHref}
                className={
                  isFavoriteVariant
                    ? "inline-flex h-10 items-center justify-center rounded-md bg-[#1822d9] px-3 text-sm font-semibold text-white transition hover:bg-[#1118b8]"
                    : "inline-flex h-10 items-center justify-center rounded-lg border border-[#1822d9] bg-white px-3 text-sm font-semibold text-[#1822d9] transition hover:bg-[#eef3ff]"
                }
              >
                Ver Producto
              </Link>

              <button
                type="button"
                onClick={() =>
                  void handleQuickAdd()
                }
                disabled={
                  !isAvailable ||
                  isAdding ||
                  isLoadingCartProduct
                }
                aria-label={`Agregar ${name} al carrito`}
                className={
                  isFavoriteVariant
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#1822d9] text-white transition hover:bg-[#1118b8] disabled:cursor-not-allowed disabled:opacity-50"
                    : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1822d9] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                }
              >
                <ShoppingCart
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {!isFavoriteVariant ? (
                  <>
                    {isLoadingCartProduct
                      ? "Cargando..."
                      : isAdding
                        ? "Agregando..."
                        : addToCartLabel}
                  </>
                ) : null}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_42px] gap-2">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1822d9] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comprar ahora
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleQuickAdd()
                }
                disabled={
                  !isAvailable ||
                  isAdding
                }
                aria-label={`Agregar ${name} al carrito`}
                className="flex h-10 items-center justify-center rounded-lg bg-[#dbe6ff] text-[#1822d9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
          )}

          {cartSuccess ? (
            <CartNotification
              type="success"
              message={cartSuccess}
              onClose={() =>
                setCartSuccess("")
              }
            />
          ) : null}

          {cartError ? (
            <CartNotification
              type="error"
              message={cartError}
              onClose={() =>
                setCartError("")
              }
            />
          ) : null}
        </div>
      </div>

      {showBuyNowModal ? (
        <BuyNowVariantModal
          productName={name}
          variants={
            availableVariants
          }
          onClose={() =>
            setShowBuyNowModal(
              false,
            )
          }
          onConfirm={
            confirmBuyNow
          }
        />
      ) : null}

      {showAddToCartModal &&
      cartProduct ? (
        <BuyNowVariantModal
          productName={name}
          variants={cartVariants}
          title="Selecciona talla y color"
          confirmLabel="Añadir al carrito"
          pendingLabel="Agregando..."
          isConfirming={isAdding}
          onClose={() => {
            if (!isAdding) {
              setShowAddToCartModal(
                false,
              );
            }
          }}
          onConfirm={
            confirmAddToCart
          }
        />
      ) : null}
    </article>
  );
}
