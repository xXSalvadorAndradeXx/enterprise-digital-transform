"use client";

import { useEffect, useState } from "react";
import {
  getPublicCategories,
  type PublicCategory,
} from "@/services/categories/categories.service";

export function usePublicCategories() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getPublicCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
          setHasError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { categories, isLoading, hasError };
}
