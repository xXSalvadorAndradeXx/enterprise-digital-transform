import {
  ApiRequestError,
  apiRequest,
  apiRequestWithResponse,
} from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type { ApiSuccess } from "@/types/api/api.types";
import type {
  ClearFavoritesData,
  ClearFavoritesResult,
  Favorite,
  FavoriteProduct,
  FavoritesPage,
  FavoritesQuery,
} from "@/types/favorites/favorites.types";

const FAVORITES_API_PATH = "/customers/me/favorites";

function getRequiredCustomerHeaders(): Record<string, string> {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Se requiere una sesion activa para gestionar favoritos.",
      401,
      null,
      "UNAUTHORIZED",
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildFavoritesPath(query?: FavoritesQuery): string {
  const searchParams = new URLSearchParams();

  if (query?.page !== undefined) {
    searchParams.set("page", String(query.page));
  }

  if (query?.limit !== undefined) {
    searchParams.set("limit", String(query.limit));
  }

  const queryString = searchParams.toString();

  return queryString
    ? `${FAVORITES_API_PATH}?${queryString}`
    : FAVORITES_API_PATH;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const numericValue = Math.floor(toNumber(value, fallback));

  return numericValue > 0 ? numericValue : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function getImageUrl(product: Record<string, unknown>): string | null {
  const directUrl =
    toNullableString(product.imageUrl) ??
    toNullableString(product.primaryImage);

  if (directUrl) {
    return directUrl;
  }

  if (!Array.isArray(product.images)) {
    return null;
  }

  const firstImage = product.images[0];

  if (typeof firstImage === "string") {
    return toNullableString(firstImage);
  }

  if (!isRecord(firstImage)) {
    return null;
  }

  return (
    toNullableString(firstImage.url) ??
    toNullableString(firstImage.imageUrl)
  );
}

function getHasDiscount(product: Record<string, unknown>): boolean {
  if (typeof product.hasDiscount === "boolean") {
    return product.hasDiscount;
  }

  const discount = product.discount;

  return isRecord(discount) && discount.isActive === true;
}

function normalizeFavoriteProduct(value: unknown): FavoriteProduct {
  if (!isRecord(value)) {
    throw new Error("FAVORITES_RESPONSE_ERROR");
  }

  const stock = toNumber(value.stock ?? value.stockTotal, 0);

  return {
    id: String(value.id ?? ""),
    commercialName: String(value.commercialName ?? value.nombre ?? ""),
    imageUrl: getImageUrl(value),
    salePrice:
      typeof value.salePrice === "number"
        ? value.salePrice
        : String(value.salePrice ?? value.precio ?? "0"),
    hasDiscount: getHasDiscount(value),
    stock,
    availability: String(
      value.availability ?? (stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK"),
    ),
  };
}

function normalizeFavorite(value: unknown): Favorite {
  if (!isRecord(value)) {
    throw new Error("FAVORITES_RESPONSE_ERROR");
  }

  return {
    favoriteId: String(value.favoriteId ?? value.id ?? ""),
    createdAt: String(value.createdAt ?? ""),
    product: normalizeFavoriteProduct(value.product),
  };
}

function normalizeFavoritesPage(value: unknown): FavoritesPage {
  if (!isRecord(value)) {
    throw new Error("FAVORITES_RESPONSE_ERROR");
  }

  const meta = isRecord(value.meta) ? value.meta : null;
  const rawItems = Array.isArray(value.items) ? value.items : [];
  const total = Math.max(
    0,
    toNumber(value.total ?? meta?.total, rawItems.length),
  );
  const limit = toPositiveInteger(value.limit ?? meta?.limit, 10);
  const totalPages = toPositiveInteger(
    value.totalPages ?? meta?.totalPages,
    Math.max(1, Math.ceil(total / limit)),
  );

  return {
    items: rawItems.map(normalizeFavorite),
    total,
    page: toPositiveInteger(value.page ?? meta?.page, 1),
    limit,
    totalPages,
  };
}

export async function getFavorites(
  query?: FavoritesQuery,
  signal?: AbortSignal,
): Promise<FavoritesPage> {
  const response = await apiRequest<ApiSuccess<unknown>>(
    buildFavoritesPath(query),
    {
      headers: getRequiredCustomerHeaders(),
      signal,
    },
  );

  return normalizeFavoritesPage(response.data);
}

export async function removeFavorite(
  productId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequestWithResponse<ApiSuccess<unknown> | null>(
    `${FAVORITES_API_PATH}/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: getRequiredCustomerHeaders(),
      signal,
    },
  );
}

export async function clearFavorites(
  signal?: AbortSignal,
): Promise<ClearFavoritesResult> {
  const response = await apiRequestWithResponse<
    ApiSuccess<ClearFavoritesData> | null
  >(FAVORITES_API_PATH, {
    method: "DELETE",
    headers: getRequiredCustomerHeaders(),
    signal,
  });

  return {
    deletedCount:
      response.data?.data &&
      typeof response.data.data.deletedCount === "number"
        ? response.data.data.deletedCount
        : null,
  };
}

export const favoritesService = {
  getFavorites,
  removeFavorite,
  clearFavorites,
};
