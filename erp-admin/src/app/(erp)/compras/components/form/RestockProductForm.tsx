"use client";

import { SearchBar } from "../SearchBar";
import { RestockTable, type RestockSize } from "./RestockTable";

export type RestockDraft = {
  search: string;
  sizes: RestockSize[];
};

type RestockProductFormProps = {
  value: RestockDraft;
  onChange: (value: RestockDraft) => void;
};

// Fixtures visuales temporales de TASK 686. Retirar al integrar el inventario real.
export const INITIAL_RESTOCK_DRAFT: RestockDraft = {
  search: "",
  sizes: [
    { size: "S", currentStock: 35, quantity: "" },
    { size: "M", currentStock: 12, quantity: "" },
    { size: "L", currentStock: 28, quantity: "" },
  ],
};

export function RestockProductForm({ value, onChange }: RestockProductFormProps) {
  const normalizedSearch = value.search.trim().toLocaleLowerCase();
  const productMatches =
    !normalizedSearch ||
    "Raw Black T-Shirt".toLocaleLowerCase().includes(normalizedSearch) ||
    "Moda".toLocaleLowerCase().includes(normalizedSearch);

  const total = value.sizes.reduce((sum, row) => {
    const quantity = Number(row.quantity);
    return Number.isFinite(quantity) && quantity >= 0 ? sum + quantity : sum;
  }, 0);

  return (
    <section
      aria-labelledby="restock-product-title"
      className="w-full max-w-[820px] pb-11"
    >
      <h2 id="restock-product-title" className="text-xl font-semibold text-[#202124]">
        Reabastecer producto
      </h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,500px)_210px] lg:items-center lg:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
          <span className="shrink-0 text-sm font-medium">
            Buscar producto:
          </span>
          <SearchBar
            value={value.search}
            placeholder="Buscar en el inventario"
            ariaLabel="Buscar producto en el inventario"
            onChange={(search) => onChange({ ...value, search })}
            className="w-full lg:w-[300px]"
          />
        </div>
        <div className="w-full lg:w-[210px]">
          <select
            id="restock-category"
            value="fashion"
            onChange={() => undefined}
            aria-label="Categoría"
            className="h-9 w-full border-0 border-b border-[#B7BAC2] bg-white px-1 pr-8 text-sm outline-none focus:border-[#1C21D1] focus:ring-0"
          >
            <option value="fashion">Moda</option>
          </select>
        </div>
      </div>

      {productMatches ? (
        <div className="mt-[60px]">
          <RestockTable
            rows={value.sizes}
            onQuantityChange={(size, quantity) =>
              onChange({
                ...value,
                sizes: value.sizes.map((row) => (row.size === size ? { ...row, quantity } : row)),
              })
            }
          />
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-base font-semibold text-[#202124]">
              Total a reabastecer
            </span>
            <output
              aria-label="Total a reabastecer"
              className="flex h-8 w-[88px] items-center justify-center rounded-[4px] border border-[#D9DAE0] bg-[#F7F7F8] px-3 text-sm font-semibold text-[#202124]"
            >
              {total}
            </output>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-[#F5F7FA] px-4 py-5 text-sm text-[#4A4A4A]">
          No se encontraron productos.
        </p>
      )}
    </section>
  );
}
