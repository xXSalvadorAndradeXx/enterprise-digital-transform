"use client";

import type { Product } from "@/types/products/product.types";
import ProductCard from "@/components/products/ProductCard";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import type { FavoriteProduct } from "@/types/favorites/favorites.types";
import AccountPageHeader from "@/components/account/AccountPageHeader";

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

function favoriteProductToProduct(product: FavoriteProduct): Product {
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
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando favoritos"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <span className="sr-only">Cargando favoritos...</span>

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

function EmptyFavoritesIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 150"
      fill="none"
      className="mb-3 h-auto w-[118px] sm:w-[142px]"
    >
      <path
        d="M33.4 32.6C47.8 13.8 77.8 11.1 103.2 18.4c25.9 7.5 45.4 25.9 46.4 48.8.9 23.8-17.1 48.7-43.3 59.1-25.9 10.3-59.4 6.9-75-13.2C15.9 93.2 19 51.2 33.4 32.6Z"
        fill="#F7F0FF"
      />
      <path
        d="M72 23v11M80 20v12M88 23v11"
        stroke="#4A4653"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M36 52v12M30 58h12"
        stroke="#4A4653"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="m125 39 3.1 5.8 6.5 1-4.7 4.5 1.1 6.4-6-3-5.8 3 1.1-6.4-4.7-4.5 6.5-1 2.9-5.8Z"
        fill="#ECE2FF"
        stroke="#4A4653"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <path
        d="M126 82v9M121.5 86.5h9"
        stroke="#9B86E8"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M80 89.5 55.6 66.8c-8-7.4-8.9-18.8-2.2-25.2 6.4-6.2 16.9-5.7 23.5 1.1l3.1 3.2 3.1-3.2c6.6-6.8 17.1-7.3 23.5-1.1 6.7 6.4 5.8 17.8-2.2 25.2L80 89.5Z"
        fill="#C9C3FF"
        stroke="#4A4653"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M45 82.5h70l-8.4 13.2H53.4L45 82.5Z"
        fill="#FFFFFF"
        stroke="#4A4653"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M51.5 95.6h57L103 121.3a7 7 0 0 1-6.8 5.6H63.8a7 7 0 0 1-6.8-5.6l-5.5-25.7Z"
        fill="#F3E9FF"
        stroke="#4A4653"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M64 111.5h32"
        stroke="#D7C6FB"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="51" cy="76" r="2.7" fill="#D6C3FF" />
      <circle cx="112" cy="28" r="2.4" fill="#D6C3FF" />
    </svg>
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
  const hasMutationInProgress =
    isClearing || removingProductId !== null;

  const canGoBack =
    page > 1 && !isLoading && !hasMutationInProgress;

  const canGoForward =
    page < totalPages && !isLoading && !hasMutationInProgress;

  const handleFavoriteToggle = async (
    nextFavorite: boolean,
    product: Product,
  ) => {
    if (
      nextFavorite ||
      isClearing ||
      removingProductId !== null
    ) {
      return;
    }

    await removeFavorite(String(product.id));
  };

  const handleClearFavorites = async () => {
    if (
      !hasFavorites ||
      isClearing ||
      removingProductId !== null
    ) {
      return;
    }

    await clearFavorites();
  };

  return (
    <section className="min-h-[calc(100vh-10rem)] text-[#111111]">
      <AccountPageHeader
        title="Favoritos"
        description={total > 0
          ? `${total} ${total === 1 ? "artículo guardado" : "artículos guardados"}. Encuentra aquí los productos que más te gustan.`
          : "Guarda tus productos preferidos para encontrarlos fácilmente más adelante."}
        action={<button
          type="button"
          onClick={() => void handleClearFavorites()}
          disabled={
            !hasFavorites ||
            isClearing ||
            removingProductId !== null
          }
          className="inline-flex h-11 items-center justify-center rounded-sm border border-[#2222e7] px-5 text-sm font-semibold text-[#2222e7] transition hover:bg-[#f2f5fb] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          {isClearing ? "Vaciando..." : "Vaciar lista"}
        </button>}
      />

      <div className="mt-8">
        {error && hasFavorites ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
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
        ) : null}

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
          <div className="flex min-h-[280px] flex-col items-center justify-center py-4 text-center">
            <EmptyFavoritesIllustration />

            <h2 className="text-xl font-bold leading-tight text-black">
              No hay artículos en esta Lista.
            </h2>

            <p className="mt-2 max-w-[520px] text-base leading-6 text-[#555555] sm:text-[17px]">
              Añade artículos que te gustaría comprar
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-5 sm:justify-start">
              {favorites.map((favorite) => {
                const product = favoriteProductToProduct(
                  favorite.product,
                );

                return (
                  <ProductCard
                    key={favorite.favoriteId}
                    product={product}
                    variant="favorite"
                    isFavorite
                    isFavoritePending={hasMutationInProgress}
                    onFavoriteToggle={handleFavoriteToggle}
                    showViewProductAction
                    addToCartLabel="Añadir al Carrito"
                  />
                );
              })}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label="Paginación de favoritos"
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
