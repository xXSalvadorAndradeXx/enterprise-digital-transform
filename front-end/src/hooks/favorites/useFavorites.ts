"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ApiRequestError } from "@/lib/api-client";
import {
  clearFavorites as clearFavoritesRequest,
  getFavorites,
  removeFavorite as removeFavoriteRequest,
} from "@/services/favorites/favorites.service";
import type {
  Favorite,
  FavoritesPage,
  FavoritesQuery,
} from "@/types/favorites/favorites.types";

export interface FavoritesError {
  message: string;
  status: number;
  code: string | null;
}

export interface UseFavoritesOptions extends FavoritesQuery {
  autoLoad?: boolean;
}

export interface UseFavoritesValue {
  favorites: Favorite[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  removingProductId: string | null;
  isClearing: boolean;
  error: FavoritesError | null;
  loadFavorites: () => Promise<FavoritesPage | null>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  removeFavorite: (productId: string) => Promise<boolean>;
  clearFavorites: () => Promise<boolean>;
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isInteger(value) && value !== undefined && value > 0
    ? value
    : fallback;
}

function normalizeFavoritesError(error: unknown): FavoritesError {
  if (error instanceof ApiRequestError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : "No se pudo completar la operacion de favoritos.",
    status: 0,
    code: null,
  };
}

function createEmptyPage(
  limit: number,
): FavoritesPage {
  return {
    items: [],
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };
}

function applyFavoritesPage(
  result: FavoritesPage,
  setFavorites: (items: Favorite[]) => void,
  setPageState: (page: number) => void,
  setLimitState: (limit: number) => void,
  setTotal: (total: number) => void,
  setTotalPages: (totalPages: number) => void,
): void {
  setFavorites(result.items);
  setPageState(result.page);
  setLimitState(result.limit);
  setTotal(result.total);
  setTotalPages(result.totalPages);
}

export function useFavorites(
  options: UseFavoritesOptions = {},
): UseFavoritesValue {
  const [page, setPageState] = useState(
    normalizePositiveInteger(options.page, 1),
  );
  const [limit, setLimitState] = useState(
    normalizePositiveInteger(options.limit, 10),
  );
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [removingProductId, setRemovingProductId] = useState<string | null>(
    null,
  );
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<FavoritesError | null>(null);
  const requestIdRef = useRef(0);
  const skipNextAutoLoadRef = useRef(false);

  const invalidatePendingLoads = useCallback(() => {
    requestIdRef.current += 1;
    setIsLoading(false);
  }, []);

  const loadFavoritesPage = useCallback(
    async (
      targetPage: number,
      targetLimit: number,
      signal?: AbortSignal,
    ): Promise<FavoritesPage | null> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);
      setError(null);

      try {
        const result = await getFavorites(
          {
            page: targetPage,
            limit: targetLimit,
          },
          signal,
        );

        if (!signal?.aborted && requestIdRef.current === requestId) {
          applyFavoritesPage(
            result,
            setFavorites,
            setPageState,
            setLimitState,
            setTotal,
            setTotalPages,
          );
        }

        return result;
      } catch (requestError) {
        if (!signal?.aborted && requestIdRef.current === requestId) {
          setFavorites([]);
          setError(normalizeFavoritesError(requestError));
        }

        return null;
      } finally {
        if (!signal?.aborted && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const loadFavorites = useCallback(
    (signal?: AbortSignal): Promise<FavoritesPage | null> =>
      loadFavoritesPage(page, limit, signal),
    [limit, loadFavoritesPage, page],
  );

  useEffect(() => {
    if (options.autoLoad === false) {
      return undefined;
    }

    if (skipNextAutoLoadRef.current) {
      skipNextAutoLoadRef.current = false;
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadFavorites(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadFavorites, options.autoLoad]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(normalizePositiveInteger(nextPage, 1));
  }, []);

  const setLimit = useCallback((nextLimit: number) => {
    setLimitState(normalizePositiveInteger(nextLimit, 10));
    setPageState(1);
  }, []);

  const removeFavorite = useCallback(
    async (productId: string): Promise<boolean> => {
      invalidatePendingLoads();
      setRemovingProductId(productId);
      setError(null);

      try {
        await removeFavoriteRequest(productId);

        const nextTotal = Math.max(0, total - 1);
        const nextTotalPages = Math.max(
          1,
          Math.ceil(nextTotal / limit),
        );
        const nextPage = Math.min(page, nextTotalPages);

        setTotal(nextTotal);
        setTotalPages(nextTotalPages);

        if (nextPage !== page) {
          skipNextAutoLoadRef.current = true;
          setPageState(nextPage);
          setFavorites([]);

          await loadFavoritesPage(nextPage, limit);
        } else {
          setFavorites((currentFavorites) =>
            currentFavorites.filter(
              (favorite) => favorite.product.id !== productId,
            ),
          );
        }

        return true;
      } catch (requestError) {
        setError(normalizeFavoritesError(requestError));
        return false;
      } finally {
        setRemovingProductId(null);
      }
    },
    [
      invalidatePendingLoads,
      limit,
      loadFavoritesPage,
      page,
      total,
    ],
  );

  const clearFavorites = useCallback(async (): Promise<boolean> => {
    invalidatePendingLoads();
    setIsClearing(true);
    setError(null);

    try {
      await clearFavoritesRequest();

      if (page !== 1) {
        skipNextAutoLoadRef.current = true;
      }
      applyFavoritesPage(
        createEmptyPage(limit),
        setFavorites,
        setPageState,
        setLimitState,
        setTotal,
        setTotalPages,
      );

      return true;
    } catch (requestError) {
      setError(normalizeFavoritesError(requestError));
      return false;
    } finally {
      setIsClearing(false);
    }
  }, [invalidatePendingLoads, limit, page]);

  return {
    favorites,
    page,
    limit,
    total,
    totalPages,
    isLoading,
    removingProductId,
    isClearing,
    error,
    loadFavorites: () => loadFavorites(),
    setPage,
    setLimit,
    removeFavorite,
    clearFavorites,
  };
}

export default useFavorites;
