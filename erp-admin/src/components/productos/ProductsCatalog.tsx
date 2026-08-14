"use client";

import { Pagination } from "@/components/ui/Pagination";

import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductsErrorState } from "./ProductsErrorState";
import { ProductsTable } from "./ProductsTable";
import { ProductsTableSkeleton } from "./ProductsTableSkeleton";
import { ProductsToolbar } from "./ProductsToolbar";

import { useProductsCatalog } from "@/hooks/productos/useProductsCatalog";

export function ProductsCatalog() {
  const {
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
  } = useProductsCatalog();

  const handleView = (): void => {
    // Se implementará en la funcionalidad de detalle.
  };

  const handleDelete = (): void => {
    // Se conectará al endpoint definido por contrato.
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.category !== "" ||
    filters.stockStatus !== "";

  const isCatalogEmpty =
    !isLoading &&
    !error &&
    products.length === 0 &&
    !hasActiveFilters;

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
      aria-busy={isLoading}
    >
      <ProductsToolbar
        filters={filters}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onStockStatusChange={setStockStatus}
      />

      <div className="min-h-[420px]">
        {isLoading ? (
          <ProductsTableSkeleton />
        ) : error ? (
          <ProductsErrorState
            onRetry={refetch}
            isRetrying={isRetrying}
          />
        ) : isCatalogEmpty ? (
          <ProductsEmptyState />
        ) : (
          <ProductsTable
            products={products}
            search={filters.search}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
      </div>

      {!isLoading &&
        !error &&
        !isCatalogEmpty && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
    </div>
  );
}