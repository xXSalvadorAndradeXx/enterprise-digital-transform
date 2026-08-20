"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { Pagination } from "@/components/ui/Pagination";

import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductsErrorState } from "./ProductsErrorState";
import { ProductsTable } from "./ProductsTable";
import { ProductsTableSkeleton } from "./ProductsTableSkeleton";
import { ProductsToolbar } from "./ProductsToolbar";
import { DeleteProductConfirmModal } from "./DeleteProductConfirmModal";
import { ProductResultModal } from "./ProductResultModal";

import {
  useProductsCatalog,
} from "@/hooks/productos/useProductsCatalog";

import {
  useDeleteProduct,
} from "@/hooks/productos/useDeleteProduct";

import {
  getPurchaseCategories,
} from "@/app/(erp)/compras/services/categories.service";

import type {
  ProductSummary,
} from "@/types/productos";

export function ProductsCatalog() {
  const router =
    useRouter();

  const {
    filters,
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

  const {
    remove,
    isLoading:
      isDeleting,
    error:
      deleteError,
  } = useDeleteProduct();

  const [
    productToDelete,
    setProductToDelete,
  ] =
    useState<ProductSummary | null>(
      null,
    );

  const [
    resultModal,
    setResultModal,
  ] =
    useState<{
      type:
        | "success"
        | "error";
      title: string;
      message: string;
    } | null>(null);

  const [
    categories,
    setCategories,
  ] = useState<Array<{
    label: string;
    value: string;
  }>>([]);

  useEffect(() => {
    const controller = new AbortController();

    void getPurchaseCategories(
      controller.signal,
    )
      .then((items) => {
        setCategories(
          items.map((category) => ({
            label: category.name,
            value: String(category.id),
          })),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const handleView = (
    product: ProductSummary,
  ): void => {
    router.push(
      `/productos/${product.id}`,
    );
  };

  const handleDelete = (
    product: ProductSummary,
  ): void => {
    setProductToDelete(
      product,
    );
  };

  const handleConfirmDelete =
    async (): Promise<void> => {
      if (!productToDelete) {
        return;
      }

      const deleted =
        await remove(
          productToDelete.id,
        );

      if (!deleted) {
        setResultModal({
          type: "error",
          title:
            "¡Algo salió mal!",
          message:
            deleteError?.message ??
            "No se pudo eliminar el producto.",
        });

        return;
      }

      setProductToDelete(
        null,
      );

      setResultModal({
        type: "success",
        title:
          "¡Producto eliminado!",
        message:
          "El producto fue retirado correctamente del catálogo.",
      });

      refetch();
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
    <>
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
          meta.totalPages > 0 &&
          products.length > 0 && (
            <Pagination
              currentPage={
                meta.page
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

      <DeleteProductConfirmModal
        isOpen={
          productToDelete !== null
        }
        isLoading={
          isDeleting
        }
        onCancel={() =>
          setProductToDelete(null)
        }
        onConfirm={
          handleConfirmDelete
        }
      />

      <ProductResultModal
        isOpen={
          resultModal !==
          null
        }
        type={
          resultModal?.type ??
          "success"
        }
        title={
          resultModal?.title ??
          ""
        }
        message={
          resultModal?.message ??
          ""
        }
        onClose={() =>
          setResultModal(
            null,
          )
        }
      />
    </>
  );
}
