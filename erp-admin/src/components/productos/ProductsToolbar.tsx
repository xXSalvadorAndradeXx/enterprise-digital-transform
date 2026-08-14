"use client";

import { CirclePlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { SearchBar } from "@/components/ui/SearchBar";
import { ProductFilter } from "./ProductFilter";

import {
  PRODUCT_CATEGORY_PLACEHOLDER,
  PRODUCT_STATUS_PLACEHOLDER,
  PRODUCT_STOCK_STATUS_OPTIONS,
} from "@/constants/productos";

import type {
  ProductCatalogFilters,
  ProductStockStatus,
} from "@/types/productos";

interface ProductCategoryOption {
  label: string;
  value: string;
}

interface ProductsToolbarProps {
  filters: ProductCatalogFilters;
  categories: ProductCategoryOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStockStatusChange: (
    value: ProductStockStatus | "",
  ) => void;
}

export function ProductsToolbar({
  filters,
  categories,
  onSearchChange,
  onCategoryChange,
  onStockStatusChange,
}: ProductsToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <h1 className="shrink-0 text-lg font-semibold text-gray-900">
        Productos
      </h1>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap lg:items-center">
        <ProductFilter
          type="category"
          placeholder={PRODUCT_CATEGORY_PLACEHOLDER}
          value={filters.category}
          options={categories}
          onChange={onCategoryChange}
        />

        <ProductFilter
          type="status"
          placeholder={PRODUCT_STATUS_PLACEHOLDER}
          value={filters.stockStatus}
          options={PRODUCT_STOCK_STATUS_OPTIONS}
          onChange={(value) =>
            onStockStatusChange(
              value as ProductStockStatus | "",
            )
          }
        />

        <button
          type="button"
          onClick={() =>
            router.push("/productos/publicar")
          }
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#1C21D1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#171AAD]"
        >
          <CirclePlus
            size={16}
            strokeWidth={1.8}
          />

          Añadir producto
        </button>

        <div className="w-full sm:w-[220px]">
          <SearchBar
            value={filters.search}
            onChange={onSearchChange}
            placeholder="Buscar productos"
          />
        </div>
      </div>
    </div>
  );
}