"use client";

import {
  useRouter,
} from "next/navigation";

import { Pagination } from "@/components/ui/Pagination";

import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductsErrorState } from "./ProductsErrorState";
import { ProductsTable } from "./ProductsTable";
import { ProductsTableSkeleton } from "./ProductsTableSkeleton";
import { ProductsToolbar } from "./ProductsToolbar";

import { useProductsCatalog } from "@/hooks/productos/useProductsCatalog";

import type {
  ProductSummary,
} from "@/types/productos";

export function ProductsCatalog() {
  const router =
    useRouter();

  const {
    filters,

    page,

    products,
    meta,

    isLoading,
    error,

    setSearch,
    setCategory,
    setStatus,

    setPage,

    refetch,
  } = useProductsCatalog();

  /*
   * Las categorías reales deberán
   * provenir del módulo correspondiente.
   */
  const categories: Array<{
    label: string;
    value: string;
  }> = [];

  const handleView = (
    product:
      ProductSummary,
  ): void => {
    router.push(
      `/productos/${product.id}`,
    );
  };

  const handleDelete = (
    _product:
      ProductSummary,
  ): void => {
    /*
     * Se conectará con useDeleteProduct
     * en la tarea/flujo de eliminación.
     */
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.categoryId !== "" ||
    filters.status !== "";

  const isCatalogEmpty =
    !isLoading &&
    !error &&
    products.length === 0 &&
    !hasActiveFilters;

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
      aria-busy={
        isLoading
      }
    >
      <ProductsToolbar
        search={
          filters.search
        }
        categoryId={
          filters.categoryId
        }
        status={
          filters.status
        }
        categories={
          categories
        }
        onSearchChange={
          setSearch
        }
        onCategoryChange={
          setCategory
        }
        onStatusChange={
          setStatus
        }
      />

      <div className="min-h-[420px]">
        {isLoading ? (
          <ProductsTableSkeleton />
        ) : error ? (
          <ProductsErrorState
            onRetry={
              refetch
            }
          />
        ) : isCatalogEmpty ? (
          <ProductsEmptyState />
        ) : (
          <ProductsTable
            products={
              products
            }
            search={
              filters.search
            }
            onView={
              handleView
            }
            onDelete={
              handleDelete
            }
          />
        )}
      </div>

      {!isLoading &&
        !error &&
        meta &&
        meta.totalPages >
          0 &&
        products.length >
          0 && (
          <Pagination
            currentPage={
              page
            }
            totalPages={
              meta.totalPages
            }
            onPageChange={
              setPage
            }
          />
        )}
    </div>
  );
}