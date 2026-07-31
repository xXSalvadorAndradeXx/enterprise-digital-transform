"use client";

import { getMockInventory } from "../../data/mockInventory";
import { SearchBar } from "../SearchBar";
import { RestockTable, type RestockSize } from "./RestockTable";

export type RestockDraft = {
  search: string;
  selectedProductId: string;
  sizes: RestockSize[];
};

export type RestockFormErrors = {
  selectedProductId?: string;
  sizes?: Record<string, string | undefined>;
  sizesGeneral?: string;
};

type RestockProductFormProps = {
  value: RestockDraft;
  onChange: (value: RestockDraft) => void;
  errors?: RestockFormErrors;
};

export const MOCK_RESTOCK_PRODUCT_ID = "mock-raw-black-t-shirt";

export function createInitialRestockDraft(): RestockDraft {
  return {
    search: "",
    selectedProductId: "",
    sizes: [],
  };
}

export const INITIAL_RESTOCK_DRAFT: RestockDraft = createInitialRestockDraft();

export function RestockProductForm({
  value,
  onChange,
  errors,
}: RestockProductFormProps) {
  const inventory = getMockInventory();
  const normalizedSearch = value.search.trim().toLocaleLowerCase();
  const matchingProducts = inventory.filter((product) => {
    if (!normalizedSearch) return true;
    return (
      product.name.toLocaleLowerCase().includes(normalizedSearch) ||
      product.sku.toLocaleLowerCase().includes(normalizedSearch)
    );
  });
  const selectedProduct = inventory.find(
    (product) => product.id === value.selectedProductId,
  );
  const total = value.sizes.reduce((sum, row) => {
    const quantity = Number(row.quantity);
    return Number.isFinite(quantity) && quantity >= 0 ? sum + quantity : sum;
  }, 0);

  const selectProduct = (productId: string) => {
    const product = inventory.find((item) => item.id === productId);
    onChange({
      ...value,
      selectedProductId: productId,
      search: product?.name ?? value.search,
      sizes:
        product?.variants.map((variant) => ({
          size: variant.size,
          currentStock: variant.stock,
          quantity: "",
        })) ?? [],
    });
  };

  return (
    <section
      aria-labelledby="restock-product-title"
      className="w-full max-w-[820px] pb-11"
    >
      <h2 id="restock-product-title" className="text-xl font-semibold text-[#202124]">
        Reabastecer producto
      </h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,500px)_210px] lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <span className="shrink-0 text-sm font-medium">Buscar producto:</span>
            <SearchBar
              value={value.search}
              placeholder="Buscar por nombre o SKU"
              ariaLabel="Buscar producto en el inventario"
              onChange={(search) =>
                onChange({
                  ...value,
                  search,
                  selectedProductId: "",
                  sizes: [],
                })
              }
              className="w-full lg:w-[300px]"
            />
          </div>

          {!selectedProduct && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-[#D9DAE0] bg-white">
              {matchingProducts.length > 0 ? (
                matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product.id)}
                    className="flex w-full items-center justify-between border-b border-[#E1E4E9] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[#F5F7FA] focus-visible:outline-2 focus-visible:outline-[#1C21D1]"
                  >
                    <span>{product.name}</span>
                    <span className="text-xs text-[#6B6F78]">{product.sku}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-sm text-[#4A4A4A]">
                  No se encontraron productos.
                </p>
              )}
            </div>
          )}

          <div className="min-h-6 pt-1">
            {errors?.selectedProductId && (
              <p role="alert" className="text-xs text-red-600">
                {errors.selectedProductId}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-[#6B6F78]">Categoría</p>
          <p className="mt-2 border-b border-[#B7BAC2] pb-2 text-sm">
            {selectedProduct?.category ?? "Sin seleccionar"}
          </p>
        </div>
      </div>

      {selectedProduct && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p><span className="font-semibold">Producto:</span> {selectedProduct.name}</p>
            <p><span className="font-semibold">SKU:</span> {selectedProduct.sku}</p>
          </div>
          <RestockTable
            rows={value.sizes}
            errors={errors?.sizes}
            onQuantityChange={(size, quantity) =>
              onChange({
                ...value,
                sizes: value.sizes.map((row) =>
                  row.size === size ? { ...row, quantity } : row,
                ),
              })
            }
          />
          <div className="min-h-6 pt-1">
            {errors?.sizesGeneral && (
              <p role="alert" className="text-xs text-red-600">
                {errors.sizesGeneral}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-base font-semibold text-[#202124]">
              Total a reabastecer
            </span>
            <output
              aria-label="Total a reabastecer"
              className="flex h-8 w-[88px] items-center justify-center rounded-[4px] border border-[#D9DAE0] bg-[#F7F7F8] px-3 text-sm font-semibold"
            >
              {total}
            </output>
          </div>
        </div>
      )}
    </section>
  );
}
