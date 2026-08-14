"use client";

import { useCallback, useState } from "react";

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
  isRetrying: boolean;

  error: string | null;

  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setStockStatus: (
    value: ProductStockStatus | "",
  ) => void;

  setPage: (page: number) => void;

  refetch: () => Promise<void>;
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
   * FE-PROD-03:
   * Los estados de carga, vacío y error ya están separados
   * visualmente.
   *
   * La información real será obtenida mediante Service + MSW
   * cuando se implemente el contrato de API del catálogo.
   */

  const products: ProductTableItem[] = [];

  const categories: ProductCategoryOption[] = [];

  const totalPages = 1;

  const isLoading = false;

  const isRetrying = false;

  /*
   * null = la petición no produjo un error.
   *
   * Un arreglo vacío de productos NO debe utilizarse para
   * representar un error de comunicación.
   */
  const error: string | null =  "No se pudieron cargar los productos.";


  const setSearch = (value: string): void => {
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

  const refetch =
    useCallback(async (): Promise<void> => {
      /*
       * Se conectará al Service cuando esté disponible
       * el contrato del endpoint del catálogo.
       */
    }, []);

  return {
    products,
    categories,
    filters,

    page,
    totalPages,

    isLoading,
    isRetrying,

    error,

    setSearch,
    setCategory,
    setStockStatus,

    setPage,

    refetch,
  };
}