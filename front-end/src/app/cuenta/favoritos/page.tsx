"use client";

import Image from "next/image";
import type { Product } from "@/types/products/product.types";
import ProductCard from "@/components/products/ProductCard";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import type { FavoriteProduct } from "@/types/favorites/favorites.types";

const FAVORITES_LIMIT = 9;

function toProductAvailability(
  availability: string,
  stock: number,
): Product["availability"] {
  if (
    availability === "IN_STOCK" ||
    availability === "LOW_STOCK" ||
    availability === "OUT_OF_STOCK"
  ) {
    return availability;
  }

  return stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
}

function favoriteProductToProduct(
  product: FavoriteProduct,
): Product {
  const price = String(product.salePrice ?? "0");
  const imageUrl = product.imageUrl ?? "";

  return {
    id: product.id,
    nombre: product.commercialName,
    commercialName: product.commercialName,
    descripcion: "",
    precio: price,
    salePrice: price,
    effectivePrice: price,
    stock: product.stock,
    stockTotal: product.stock,
    availability: toProductAvailability(
      product.availability,
      product.stock,
    ),
    imagenUrl: imageUrl,
    primaryImage: imageUrl || null,
    images: imageUrl
      ? [
          {
            id: `${product.id}-image`,
            url: imageUrl,
            alt: product.commercialName,
          },
        ]
      : [],
    createdAt: "",
    category: null,
    discount: product.hasDiscount
      ? {
          percentage: 0,
          isActive: true,
        }
      : null,
    variants: [],
  };
}

function FavoriteGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[370px] animate-pulse rounded-lg border border-[#e0e3e8] bg-white p-4"
        >
          <div className="h-44 bg-[#F4F7FB]" />
          <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
          <div className="mt-8 h-5 w-1/2 rounded bg-slate-200" />
          <div className="mt-5 h-10 rounded bg-slate-200" />
          <div className="mt-2 h-10 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const {
    favorites,
    page,
    total,
    totalPages,
    isLoading,
    isClearing,
    removingProductId,
    error,
    loadFavorites,
    setPage,
    removeFavorite,
    clearFavorites,
  } = useFavorites({
    limit: FAVORITES_LIMIT,
  });

  const hasFavorites = favorites.length > 0;
  const canGoBack = page > 1 && !isLoading;
  const canGoForward = page < totalPages && !isLoading;

  const handleFavoriteToggle = async (
    nextFavorite: boolean,
    product: Product,
  ) => {
    if (nextFavorite) {
      return;
    }

    await removeFavorite(String(product.id));
  };

  const handleClearFavorites = async () => {
    if (!hasFavorites || isClearing) {
      return;
    }

    await clearFavorites();
  };

  return (
    <section className="min-h-[calc(100vh-10rem)] text-[#111111]">
      <header className="flex flex-col gap-4 border-b border-[#d9dde5] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Favoritos
          </h1>

          {total > 0 ? (
            <p className="mt-2 text-sm font-medium text-[#4A4A4A]">
              {total} {total === 1 ? "art\u00edculo guardado" : "art\u00edculos guardados"}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleClearFavorites()}
          disabled={!hasFavorites || isClearing}
          className="inline-flex h-11 items-center justify-center rounded-sm border border-[#2222e7] px-5 text-sm font-semibold text-[#2222e7] transition hover:bg-[#f2f5fb] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          {isClearing ? "Vaciando..." : "Vaciar lista"}
        </button>
      </header>

      <div className="mt-8">
        {isLoading && !hasFavorites ? (
          <FavoriteGridSkeleton />
        ) : error && !hasFavorites ? (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            <p>{error.message}</p>
            <button
              type="button"
              onClick={() => void loadFavorites()}
              className="mt-3 text-[#1822d9] underline-offset-4 hover:underline"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : !hasFavorites ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <Image
              src="/images/cart-empty.svg"
              alt=""
              aria-hidden="true"
              className="mb-5 h-[180px] w-[180px] object-contain"
              width={180}
              height={180}
            />

            <h2 className="text-3xl font-bold text-black">
              {"No hay art\u00edculos en esta lista."}
            </h2>

            <p className="mt-5 max-w-[520px] text-lg leading-8 text-[#555555]">
              {"A\u00f1ade art\u00edculos que te gustar\u00eda comprar"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {favorites.map((favorite) => {
                const product = favoriteProductToProduct(favorite.product);

                return (
                  <ProductCard
                    key={favorite.favoriteId}
                    product={product}
                    isFavorite
                    isFavoritePending={removingProductId === product.id}
                    onFavoriteToggle={handleFavoriteToggle}
                    showViewProductAction
                    addToCartLabel="Añadir al Carrito"
                  />
                );
              })}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label={"Paginaci\u00f3n de favoritos"}
                className="mt-10 flex items-center justify-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={!canGoBack}
                  className="h-10 rounded-sm border border-[#d9dde5] px-4 text-sm font-semibold transition hover:bg-[#f2f5fb] disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                >
                  Anterior
                </button>

                <span className="text-sm font-semibold text-[#4A4A4A]">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={!canGoForward}
                  className="h-10 rounded-sm border border-[#d9dde5] px-4 text-sm font-semibold transition hover:bg-[#f2f5fb] disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                >
                  Siguiente
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
