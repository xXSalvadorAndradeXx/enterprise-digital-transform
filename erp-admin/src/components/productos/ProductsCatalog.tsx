"use client";

import { Pagination } from "@/components/ui/Pagination";

import { ProductsTable } from "./ProductsTable";
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
    setSearch,
    setCategory,
    setStockStatus,
    setPage,
  } = useProductsCatalog();

  const handleView = (): void => {
    // Se implementará en la funcionalidad de detalle.
  };

  const handleDelete = (): void => {
    // Se conectará al endpoint definido por contrato.
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <ProductsToolbar
        filters={filters}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onStockStatusChange={setStockStatus}
      />

      <ProductsTable
        products={products}
        isLoading={isLoading}
        search={filters.search}
        onView={handleView}
        onDelete={handleDelete}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}