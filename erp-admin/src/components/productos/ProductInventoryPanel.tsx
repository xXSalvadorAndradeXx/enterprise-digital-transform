"use client";

import {
  CheckCircle2,
  Search,
} from "lucide-react";

import { InventorySearchResults } from "./InventorySearchResults";

import type {
  InventoryProductView,
  ProductFormMode,
} from "@/types/productos/product-form.types";

interface ProductInventoryPanelProps {
  mode: ProductFormMode;

  inventory:
    | InventoryProductView
    | null;

  error?: string;

  inventorySearch: string;

  onInventorySearchChange: (
    value: string,
  ) => void;

  searchResults:
    InventoryProductView[];

  isSearching: boolean;

  searchError:
    | string
    | null;

  hasSearched: boolean;

  onSelectInventory: (
    inventory: InventoryProductView,
  ) => void | Promise<void>;
}

export function ProductInventoryPanel({
  mode,
  inventory,
  error,
  inventorySearch,
  onInventorySearchChange,
  searchResults,
  isSearching,
  searchError,
  hasSearched,
  onSelectInventory,
}: ProductInventoryPanelProps) {
  const isOutOfStock =
    inventory?.inventoryStatus ===
    "OUT_OF_STOCK";

  const getInventoryStatusLabel = (
    status:
      InventoryProductView["inventoryStatus"],
  ): string => {
    switch (status) {
      case "ACTIVE":
        return "Activo";

      case "LOW_STOCK":
        return "Stock bajo";

      case "OUT_OF_STOCK":
        return "Sin stock";

      default:
        return status;
    }
  };

  const getStockStatusClass = (
    status: "ALTO" | "MEDIO" | "BAJO",
  ): string => {
    switch (status) {
      case "ALTO":
        return "bg-green-50 text-green-700";

      case "MEDIO":
        return "bg-yellow-50 text-yellow-700";

      case "BAJO":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <section className="min-w-0 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Selección automática
      </h2>

      {mode === "create" && (
        <div className="mt-4">
          <label
            htmlFor="inventory-search"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Buscar producto en inventario
          </label>

          <div
            className={`flex overflow-hidden rounded-md border bg-white transition-colors ${
              error
                ? "border-red-400"
                : "border-gray-300"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <Search
                size={16}
                className="shrink-0 text-gray-500"
                aria-hidden="true"
              />

              <input
                id="inventory-search"
                type="search"
                value={inventorySearch}
                onChange={(event) =>
                  onInventorySearchChange(
                    event.target.value,
                  )
                }
                placeholder="Buscar producto en inventario"
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error
                    ? "inventory-search-error"
                    : undefined
                }
                className="h-11 w-full min-w-0 bg-transparent text-[15px] font-medium text-gray-900 outline-none placeholder:text-sm placeholder:font-normal placeholder:text-gray-400"
              />
            </div>
          </div>

          {error && (
            <p
              id="inventory-search-error"
              role="alert"
              className="mt-1 text-xs text-red-500"
            >
              {error}
            </p>
          )}

          <InventorySearchResults
            results={searchResults}
            isLoading={isSearching}
            hasSearched={hasSearched}
            error={searchError}
            onSelect={onSelectInventory}
          />
        </div>
      )}

      {inventory ? (
        <>
          <div
            className={`rounded-md border border-gray-300 p-5 ${
              mode === "create"
                ? "mt-4"
                : "mt-6"
            }`}
          >
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-medium text-gray-900">
                  Nombre
                </dt>

                <dd
                  className="truncate text-gray-600"
                  title={inventory.name}
                >
                  {inventory.name}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-medium text-gray-900">
                  Proveedor
                </dt>

                <dd
                  className="truncate text-gray-600"
                  title={inventory.supplier}
                >
                  {inventory.supplier}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-medium text-gray-900">
                  Marca
                </dt>

                <dd
                  className="truncate text-gray-600"
                  title={inventory.brand}
                >
                  {inventory.brand}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-medium text-gray-900">
                  Categoría
                </dt>

                <dd
                  className="truncate text-gray-600"
                  title={inventory.category}
                >
                  {inventory.category}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-medium text-gray-900">
                  Stock total
                </dt>

                <dd className="text-gray-600">
                  {inventory.totalStock}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                <dt className="font-medium text-gray-900">
                  Estado
                </dt>

                <dd>
                  <span
                    className={`inline-flex rounded-md px-3 py-1.5 text-xs font-medium ${
                      isOutOfStock
                        ? "bg-red-100 text-red-700"
                        : inventory.inventoryStatus ===
                            "LOW_STOCK"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-[rgba(52,198,29,0.20)] text-green-700"
                    }`}
                  >
                    {getInventoryStatusLabel(
                      inventory.inventoryStatus,
                    )}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {isOutOfStock && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              Este inventario no tiene stock disponible y no puede vincularse al producto.
            </div>
          )}

          <div className="mt-3 rounded-md border border-gray-300 p-2">
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              Variante de inventario
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 font-medium text-gray-700">
                      SKU
                    </th>

                    <th className="px-4 py-3 font-medium text-gray-700">
                      Talla
                    </th>

                    <th className="px-4 py-3 font-medium text-gray-700">
                      Color
                    </th>

                    <th className="px-4 py-3 font-medium text-gray-700">
                      Stock
                    </th>

                    <th className="px-4 py-3 font-medium text-gray-700">
                      Stock mínimo
                    </th>

                    <th className="px-4 py-3 font-medium text-gray-700">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {inventory.variants.length >
                  0 ? (
                    inventory.variants.map(
                      (variant) => (
                        <tr
                          key={
                            variant.inventoryDetailId
                          }
                          className="border-b border-gray-200 last:border-0"
                        >
                          <td className="px-4 py-2 text-gray-700">
                            {variant.sku}
                          </td>

                          <td className="px-4 py-2 text-gray-700">
                            {variant.size}
                          </td>

                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-5 w-5 shrink-0 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    variant.color,
                                }}
                                aria-hidden="true"
                              />

                              <span className="text-gray-700">
                                {variant.color}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-2 text-gray-700">
                            {variant.stock}
                          </td>

                          <td className="px-4 py-2 text-gray-700">
                            {variant.minStock}
                          </td>

                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${getStockStatusClass(
                                variant.stockStatus,
                              )}`}
                            >
                              {variant.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        Este inventario no tiene variantes registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-md bg-indigo-50 px-4 py-3 text-xs text-[#1C21D1]">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />

            <p>
              La información de inventario
              (stock, tallas, colores y
              stock mínimo) se actualizará
              automáticamente.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-4 flex min-h-[280px] items-center justify-center rounded-md border border-dashed border-gray-300 p-6 text-center">
          <p className="max-w-xs text-sm text-gray-500">
            Selecciona un producto del inventario para mostrar su información física.
          </p>
        </div>
      )}
    </section>
  );
}
