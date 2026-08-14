"use client";

import { useState } from "react";

import type {
  ProductCatalogFilters,
  ProductStockStatus,
  ProductTableItem,
} from "@/types/productos";

interface ProductCategoryOption {
  label: string;
  value: string;
}

interface UseProductsCatalogReturn {
  products: ProductTableItem[];
  categories: ProductCategoryOption[];
  filters: ProductCatalogFilters;
  page: number;
  totalPages: number;
  isLoading: boolean;
  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setStockStatus: (
    value: ProductStockStatus | "",
  ) => void;
  setPage: (page: number) => void;
}

export function useProductsCatalog(): UseProductsCatalogReturn {
  const [filters, setFilters] =
    useState<ProductCatalogFilters>({
      search: "",
      category: "",
      stockStatus: "",
    });

  const [page, setPage] = useState(1);

  /*
   * FE-PROD-02:
   * La vista queda preparada para recibir información.
   *
   * No agregamos datos mock tradicionales.
   * Estos valores serán reemplazados por el estado proveniente
   * del service/MSW cuando tengamos el contrato de API.
   */
  const products: ProductTableItem[] = [];

  const categories: ProductCategoryOption[] = [];

  const totalPages = 1;

  const isLoading = false;

  const setSearch = (value: string): void => {
    setFilters((current) => ({
      ...current,
      search: value,
    }));

    setPage(1);
  };

  const setCategory = (value: string): void => {
    setFilters((current) => ({
      ...current,
      category: value,
    }));

    setPage(1);
  };

  const setStockStatus = (
    value: ProductStockStatus | "",
  ): void => {
    setFilters((current) => ({
      ...current,
      stockStatus: value,
    }));

    setPage(1);
  };

  return {
    products,
    categories,
    filters,
    page,
    totalPages,
    isLoading,
    setSearch,
    setCategory,
    setStockStatus,
    setPage,
  };
}