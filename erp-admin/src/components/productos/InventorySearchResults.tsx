"use client";

import {
  Check,
  Package,
} from "lucide-react";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

interface InventorySearchResultsProps {
  results:
    InventoryProductView[];

  isLoading: boolean;

  hasSearched: boolean;

  error:
    | string
    | null;

  onSelect: (
    inventory: InventoryProductView,
  ) => void;
}

export function InventorySearchResults({
  results,
  isLoading,
  hasSearched,
  error,
  onSelect,
}: InventorySearchResultsProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-2 rounded-md border border-gray-200 bg-white p-4"
      >
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />

          <div className="h-4 w-56 animate-pulse rounded-full bg-gray-200" />

          <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
        </div>

        <span className="sr-only">
          Buscando inventarios...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mt-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {error}
      </div>
    );
  }

  if (
    hasSearched &&
    results.length === 0
  ) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-center"
      >
        <Package
          size={24}
          className="mx-auto text-gray-400"
          aria-hidden="true"
        />

        <p className="mt-2 text-sm text-gray-500">
          No se encontraron productos en inventario.
        </p>
      </div>
    );
  }

  if (
    results.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
      {results.map(
        (inventory) => {
          const isOutOfStock =
            inventory.inventoryStatus ===
            "OUT_OF_STOCK";

          return (
            <button
              key={
                inventory.inventoryId
              }
              type="button"
              disabled={
                isOutOfStock
              }
              onClick={() =>
                onSelect(
                  inventory,
                )
              }
              className="flex w-full items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {
                    inventory.name
                  }
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {
                    inventory.brand
                  }

                  {" · "}

                  {
                    inventory.category
                  }
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {inventory.brand}
                  {" · "}
                  {inventory.category}
                </p>

                <p className="mt-1 truncate text-xs text-gray-400">
                  {inventory.supplier}
                </p>
              </div>

              {isOutOfStock ? (
                <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                  Sin stock
                </span>
              ) : (
                <Check
                  size={18}
                  className="shrink-0 text-[#1C21D1]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        },
      )}
    </div>
  );
}