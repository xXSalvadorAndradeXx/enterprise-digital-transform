import { SearchX } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { ProductFilterValues } from "@/components/ProductFilters";
import type { ProductCategory, ProductsResponse } from "@/types/product";

const API_BASE_URL = "http://localhost:3000";
const PRODUCTS_ERROR_MESSAGE = "No se pudieron cargar los productos.";
const PRODUCTS_LIMIT = "10";
const PRODUCTS_OFFSET = "0";

type ProductSearchParams = Record<string, string | string[] | undefined>;

type ProductosPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

function readParam(searchParams: ProductSearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function readNonNegativeNumberParam(
  searchParams: ProductSearchParams,
  key: string,
) {
  const value = readParam(searchParams, key);

  if (!value) {
    return "";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return "";
  }

  return String(numericValue);
}

function readCategoryIdParam(searchParams: ProductSearchParams) {
  const value = readParam(searchParams, "categoryId");
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  return String(numericValue);
}

function readProductFilters(searchParams: ProductSearchParams): ProductFilterValues {
  const filters: ProductFilterValues = {
    search: readParam(searchParams, "search"),
    categoryId: readCategoryIdParam(searchParams),
    minPrice: readNonNegativeNumberParam(searchParams, "minPrice"),
    maxPrice: readNonNegativeNumberParam(searchParams, "maxPrice"),
  };

  if (
    filters.minPrice &&
    filters.maxPrice &&
    Number(filters.minPrice) > Number(filters.maxPrice)
  ) {
    return {
      ...filters,
      minPrice: "",
      maxPrice: "",
    };
  }

  return filters;
}

function hasActiveFilters(filters: ProductFilterValues) {
  return Boolean(
    filters.search || filters.categoryId || filters.minPrice || filters.maxPrice,
  );
}

function buildProductsUrl(filters: ProductFilterValues) {
  const productsUrl = new URL("/products", API_BASE_URL);

  productsUrl.searchParams.set("limit", PRODUCTS_LIMIT);
  productsUrl.searchParams.set("offset", PRODUCTS_OFFSET);

  if (filters.search) {
    productsUrl.searchParams.set("search", filters.search);
  }

  if (filters.categoryId) {
    productsUrl.searchParams.set("categoryId", filters.categoryId);
  }

  if (filters.minPrice) {
    productsUrl.searchParams.set("minPrice", filters.minPrice);
  }

  if (filters.maxPrice) {
    productsUrl.searchParams.set("maxPrice", filters.maxPrice);
  }

  return productsUrl;
}

async function getProducts(filters: ProductFilterValues) {
  try {
    const response = await fetch(buildProductsUrl(filters), {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        products: [],
        total: 0,
        errorMessage: PRODUCTS_ERROR_MESSAGE,
      };
    }

    const responseData = (await response.json()) as ProductsResponse;
    const products = Array.isArray(responseData.data?.products)
      ? responseData.data.products
      : [];
    const total =
      typeof responseData.data?.total === "number"
        ? responseData.data.total
        : products.length;

    return {
      products,
      total,
      errorMessage: "",
    };
  } catch {
    return {
      products: [],
      total: 0,
      errorMessage: PRODUCTS_ERROR_MESSAGE,
    };
  }
}

async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const categories = (await response.json()) as ProductCategory[];

    return Array.isArray(categories) ? categories : [];
  } catch {
    return [];
  }
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = readProductFilters(resolvedSearchParams);
  const filtersKey = `${filters.search}-${filters.categoryId}-${filters.minPrice}-${filters.maxPrice}`;
  const filtersAreActive = hasActiveFilters(filters);
  const [productsResult, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);
  const { products, total, errorMessage } = productsResult;

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-6 py-10 text-[#111111]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-[#D9E2EC] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase text-[#003791]">
              Catalogo
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
              Productos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Elige tecnologia de las mejores marcas, encuentra productos modernos y de la mas alta calidad.
            </p>
          </div>

          {!errorMessage ? (
            <div className="inline-flex items-center gap-3 rounded-xl border border-[#D9E2EC] bg-white px-5 py-3 shadow-[0_12px_30px_rgba(0,55,145,0.08)]">
              <span className="text-xs font-bold uppercase text-slate-500">
                Total
              </span>
              <span className="rounded-lg bg-[#EAF3FF] px-3 py-1 text-lg font-extrabold text-[#003791]">
                {total}
              </span>
            </div>
          ) : null}
        </div>

        <ProductFilters
          key={filtersKey}
          categories={categories}
          initialFilters={filters}
        />

        {errorMessage ? (
          <div className="mt-8 rounded-xl border border-red-100 bg-white px-5 py-4 text-sm font-semibold text-red-700 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            {errorMessage}
          </div>
        ) : products.length === 0 && filtersAreActive ? (
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center rounded-2xl border border-[#D9E2EC] bg-white px-6 py-9 text-center shadow-[0_16px_40px_rgba(0,55,145,0.10)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#111111]">
              No se encontraron coincidencias...
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Prueba con otra búsqueda o ajusta los filtros para descubrir más productos.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#D9E2EC] bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
