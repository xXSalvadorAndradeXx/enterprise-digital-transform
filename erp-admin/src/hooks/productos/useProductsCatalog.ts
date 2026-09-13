"use client";

import {
  useMemo,
  useState,
} from "react";

import { useProducts } from "./useProducts";

import type {
  ProductQuery,
} from "@/types/productos";

export type ProductPublicationFilter = "PUBLISHED" | "UNPUBLISHED" | "";

export interface ProductCatalogFilters {
  search: string;
  categoryId: string;
  publication: ProductPublicationFilter;
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
  setPublication: (
    value: ProductPublicationFilter,
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
      publication: "",
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

      isPublished:
        filters.publication === ""
          ? undefined
          : filters.publication === "PUBLISHED",
    }),
    [
      page,
      limit,
      filters.search,
      filters.categoryId,
      filters.publication,
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

  const setPublication = (
    value: ProductPublicationFilter,
  ): void => {
    setFilters((current) => ({
      ...current,
      publication: value,
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
    setPublication,

    setPage,

    goToPreviousPage,
    goToNextPage,

    refetch,
  };
}
