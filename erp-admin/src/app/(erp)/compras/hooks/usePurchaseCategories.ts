"use client";

import { useEffect, useState } from "react";

import {
  getPurchaseCategories,
  type PurchaseCategory,
} from "../services/categories.service";

export interface UsePurchaseCategoriesResult {
  categories: readonly PurchaseCategory[];
  loading: boolean;
  error: string | null;
}

export function usePurchaseCategories(): UsePurchaseCategoriesResult {
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getPurchaseCategories(controller.signal)
      .then((result) => {
        setCategories(result);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        setCategories([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar las categorías.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return { categories, loading, error };
}
