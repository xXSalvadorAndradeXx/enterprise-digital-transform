"use client";

import {
  useMemo,
  useState,
} from "react";

import { useProducts } from "./useProducts";

import type {
  ProductQuery,
  ProductStatus,
} from "@/types/productos";

export interface ProductCatalogFilters {
  search: string;
  categoryId: string;
  status: ProductStatus | "";
}

interface UseProductsCatalogReturn {
  filters: ProductCatalogFilters;

  page: number;
  limit: number;

  products: ReturnType<typeof useProducts>["products"];
  meta: ReturnType<typeof useProducts>["meta"];

  isLoading: boolean;
  error: ReturnType<typeof useProducts>["error"];

  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setStatus: (
    value: ProductStatus | "",
  ) => void;

  setPage: (page: number) => void;

  goToPreviousPage: () => void;
  goToNextPage: () => void;

  refetch: () => void;
}

export function useProductsCatalog(): UseProductsCatalogReturn {
  const [
    filters,
    setFilters,
  ] =
    useState<ProductCatalogFilters>({
      search: "",
      categoryId: "",
      status: "",
    });

  const [
    page,
    setPage,
  ] = useState(1);

  const limit = 20;

const query =
  useMemo<ProductQuery>(
    () => ({
      page,
      limit,

      search:
        filters.search.trim() ||
        undefined,

      categoryId:
        filters.categoryId ||
        undefined,

      status:
        filters.status ||
        undefined,
    }),
    [
      page,
      limit,
      filters.search,
      filters.categoryId,
      filters.status,
    ],
  );

  const {
    products,
    meta,
    isLoading,
    error,
    refetch,
  } = useProducts(query);

  const setSearch = (
    value: string,
  ): void => {
    setFilters((current) => ({
      ...current,
      search: value,
    }));

    setPage(1);
  };

  const setCategory = (
    value: string,
  ): void => {
    setFilters((current) => ({
      ...current,
      categoryId: value,
    }));

    setPage(1);
  };

  const setStatus = (
    value:
      | ProductStatus
      | "",
  ): void => {
    setFilters((current) => ({
      ...current,
      status: value,
    }));

    setPage(1);
  };

  const goToPreviousPage =
    (): void => {
      setPage((current) =>
        Math.max(
          1,
          current - 1,
        ),
      );
    };

  const goToNextPage =
    (): void => {
      setPage((current) => {
        if (!meta) {
          return current;
        }

        return Math.min(
          meta.totalPages,
          current + 1,
        );
      });
    };

  return {
    filters,

    page,
    limit,

    products,
    meta,

    isLoading,
    error,

    setSearch,
    setCategory,
    setStatus,

    setPage,

    goToPreviousPage,
    goToNextPage,

    refetch,
  };
}
