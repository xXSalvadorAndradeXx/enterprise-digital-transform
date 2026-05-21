"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ProductCategory } from "@/types/product";

export type ProductFilterValues = {
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
};

type ProductFiltersProps = {
  categories: ProductCategory[];
  initialFilters: ProductFilterValues;
};

const emptyFilters: ProductFilterValues = {
  search: "",
  categoryId: "",
  minPrice: "",
  maxPrice: "",
};

const DEFAULT_PRODUCTS_PAGE = "1";
const DEFAULT_PRODUCTS_LIMIT = "10";

const fieldClassName =
  "h-11 w-full rounded-lg border border-[#D9E2EC] bg-white px-3 text-sm text-[#111111] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#005BFF] focus:ring-2 focus:ring-[#EAF3FF]";

function readPositivePrice(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return Number.NaN;
  }

  return numericValue;
}

export default function ProductFilters({
  categories,
  initialFilters,
}: ProductFiltersProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ProductFilterValues>(initialFilters);
  const [validationMessage, setValidationMessage] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
    setValidationMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const minPrice = readPositivePrice(filters.minPrice);
    const maxPrice = readPositivePrice(filters.maxPrice);

    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      setValidationMessage("El rango de precio no puede ser negativo.");
      return;
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setValidationMessage(
        "El precio minimo no puede ser mayor que el precio maximo.",
      );
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.set("page", DEFAULT_PRODUCTS_PAGE);
    queryParams.set("limit", DEFAULT_PRODUCTS_LIMIT);
    const search = filters.search.trim();

    if (search) {
      queryParams.set("search", search);
    }

    if (filters.categoryId) {
      queryParams.set("categoryId", filters.categoryId);
    }

    if (minPrice !== null) {
      queryParams.set("minPrice", String(minPrice));
    }

    if (maxPrice !== null) {
      queryParams.set("maxPrice", String(maxPrice));
    }

    router.push(`/productos?${queryParams.toString()}`);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setValidationMessage("");
    router.push(
      `/productos?page=${DEFAULT_PRODUCTS_PAGE}&limit=${DEFAULT_PRODUCTS_LIMIT}`,
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-[0_12px_30px_rgba(0,55,145,0.08)]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] lg:items-end">
        <div>
          <label
            htmlFor="search"
            className="text-xs font-bold uppercase text-slate-500"
          >
            Busqueda
          </label>
          <input
            id="search"
            name="search"
            type="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Buscar por nombre o descripcion"
            className={`${fieldClassName} mt-2`}
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="text-xs font-bold uppercase text-slate-500"
          >
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={filters.categoryId}
            onChange={handleChange}
            className={`${fieldClassName} mt-2`}
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="minPrice"
            className="text-xs font-bold uppercase text-slate-500"
          >
            Precio min.
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="0"
            className={`${fieldClassName} mt-2`}
          />
        </div>

        <div>
          <label
            htmlFor="maxPrice"
            className="text-xs font-bold uppercase text-slate-500"
          >
            Precio max.
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="1000"
            className={`${fieldClassName} mt-2`}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-44 lg:grid-cols-1">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#003791] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] px-5 text-sm font-semibold text-[#003791] transition-all duration-300 hover:bg-[#EAF3FF]"
          >
            Limpiar
          </button>
        </div>
      </div>

      {validationMessage ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {validationMessage}
        </p>
      ) : null}
    </form>
  );
}
