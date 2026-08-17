"use client";

import {
  CirclePlus,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { SearchBar } from "@/components/ui/SearchBar";
import { ProductFilter } from "./ProductFilter";

import type {
  ProductStatus,
} from "@/types/productos";

interface ProductCategoryOption {
  label: string;
  value: string;
}

interface ProductsToolbarProps {
  search: string;
  categoryId: string;
  status:
    | ProductStatus
    | "";

  categories:
    ProductCategoryOption[];

  onSearchChange: (
    value: string,
  ) => void;

  onCategoryChange: (
    value: string,
  ) => void;

  onStatusChange: (
    value:
      | ProductStatus
      | "",
  ) => void;
}

const STATUS_OPTIONS: Array<{
  label: string;
  value: ProductStatus;
}> = [
  {
    label: "Borrador",
    value: "DRAFT",
  },
  {
    label: "Activo",
    value: "ACTIVE",
  },
  {
    label: "Pausado",
    value: "PAUSED",
  },
  {
    label: "Descontinuado",
    value: "DISCONTINUED",
  },
];

export function ProductsToolbar({
  search,
  categoryId,
  status,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductsToolbarProps) {
  const router =
    useRouter();

  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <h1 className="shrink-0 text-lg font-semibold text-gray-900">
        Productos
      </h1>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap lg:items-center">
        <ProductFilter
          type="category"
          placeholder="Categoría"
          value={categoryId}
          options={categories}
          onChange={onCategoryChange}
        />

        <ProductFilter
          type="status"
          placeholder="Estado"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(value) =>
            onStatusChange(
              value as
                | ProductStatus
                | "",
            )
          }
        />

        <button
          type="button"
          onClick={() =>
            router.push(
              "/productos/publicar",
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#1C21D1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#171AAD]"
        >
          <CirclePlus
            size={16}
            aria-hidden="true"
          />

          Añadir producto
        </button>

        <div className="w-full sm:w-[220px]">
          <SearchBar
            value={search}
            onChange={
              onSearchChange
            }
            placeholder="Buscar productos"
          />
        </div>
      </div>
    </div>
  );
}