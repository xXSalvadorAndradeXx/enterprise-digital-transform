import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { ProductFilterValues } from "@/components/ProductFilters";
import type { ProductCategory, ProductsResponse } from "@/types/product";

const API_BASE_URL = "http://localhost:3000";
const PRODUCTS_ERROR_MESSAGE = "No se pudieron cargar los productos.";
const DEFAULT_PRODUCTS_LIMIT = 10;
const DEFAULT_PRODUCTS_PAGE = 1;

type ProductSearchParams = Record<string, string | string[] | undefined>;

type ProductosPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

type ProductPaginationValues = {
  page: number;
  limit: number;
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

function readPositiveIntegerParam(
  searchParams: ProductSearchParams,
  key: string,
  fallbackValue: number,
) {
  const value = readParam(searchParams, key);
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }

  return numericValue;
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

function readProductPagination(
  searchParams: ProductSearchParams,
): ProductPaginationValues {
  return {
    page: readPositiveIntegerParam(
      searchParams,
      "page",
      DEFAULT_PRODUCTS_PAGE,
    ),
    limit: readPositiveIntegerParam(
      searchParams,
      "limit",
      DEFAULT_PRODUCTS_LIMIT,
    ),
  };
}

function hasActiveFilters(filters: ProductFilterValues) {
  return Boolean(
    filters.search || filters.categoryId || filters.minPrice || filters.maxPrice,
  );
}

function appendProductQueryParams(
  queryParams: URLSearchParams,
  filters: ProductFilterValues,
  pagination: ProductPaginationValues,
) {
  if (filters.search) {
    queryParams.set("search", filters.search);
  }

  if (filters.categoryId) {
    queryParams.set("categoryId", filters.categoryId);
  }

  if (filters.minPrice) {
    queryParams.set("minPrice", filters.minPrice);
  }

  if (filters.maxPrice) {
    queryParams.set("maxPrice", filters.maxPrice);
  }

  queryParams.set("page", String(pagination.page));
  queryParams.set("limit", String(pagination.limit));
}

function buildProductsUrl(
  filters: ProductFilterValues,
  pagination: ProductPaginationValues,
) {
  const productsUrl = new URL("/products", API_BASE_URL);

  appendProductQueryParams(productsUrl.searchParams, filters, pagination);

  return productsUrl;
}

function buildProductsPageHref(
  filters: ProductFilterValues,
  pagination: ProductPaginationValues,
) {
  const queryParams = new URLSearchParams();

  appendProductQueryParams(queryParams, filters, pagination);

  return `/productos?${queryParams.toString()}`;
}

async function getProducts(
  filters: ProductFilterValues,
  pagination: ProductPaginationValues,
) {
  try {
    const response = await fetch(buildProductsUrl(filters, pagination), {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        products: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        errorMessage: PRODUCTS_ERROR_MESSAGE,
      };
    }

    const responseData = (await response.json()) as ProductsResponse;
    const products = Array.isArray(responseData.data) ? responseData.data : [];
    const total =
      typeof responseData.total === "number" ? responseData.total : products.length;
    const page =
      typeof responseData.page === "number" ? responseData.page : pagination.page;
    const limit =
      typeof responseData.limit === "number"
        ? responseData.limit
        : pagination.limit;

    return {
      products,
      total,
      page,
      limit,
      errorMessage: "",
    };
  } catch {
    return {
      products: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
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
  const pagination = readProductPagination(resolvedSearchParams);
  const filtersKey = `${filters.search}-${filters.categoryId}-${filters.minPrice}-${filters.maxPrice}`;
  const filtersAreActive = hasActiveFilters(filters);
  const [productsResult, categories] = await Promise.all([
    getProducts(filters, pagination),
    getCategories(),
  ]);
  const { products, total, page, limit, errorMessage } = productsResult;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const shouldShowPagination = !errorMessage && totalPages > 1;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const previousPageHref = buildProductsPageHref(filters, {
    page: Math.max(page - 1, 1),
    limit,
  });
  const nextPageHref = buildProductsPageHref(filters, {
    page: Math.min(page + 1, totalPages),
    limit,
  });
  const disabledPaginationClassName =
    "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] px-3 text-sm font-semibold text-slate-400 sm:px-4";
  const activePaginationClassName =
    "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-[#003791] px-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md sm:px-4";

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-[#D9E2EC] pb-6 md:flex-row md:items-end md:justify-between md:pb-7">
          <div>
            <p className="inline-flex rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase text-[#003791]">
              Catalogo
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl lg:text-5xl">
              Productos
            </h1>
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base">
              Elige tecnologia de las mejores marcas, encuentra productos modernos y de la mas alta calidad.
            </p>
          </div>

          {!errorMessage ? (
            <div className="grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(0,55,145,0.08)] sm:inline-flex sm:w-auto sm:gap-3 sm:px-5">
              <span className="text-xs font-bold uppercase text-slate-500">
                Total
              </span>
              <span className="justify-self-start rounded-lg bg-[#EAF3FF] px-3 py-1 text-lg font-extrabold text-[#003791]">
                {total}
              </span>
              <span className="col-span-2 text-xs font-semibold text-slate-500 sm:col-span-1 sm:whitespace-nowrap">
                Pagina {page} de {totalPages} - {limit} por pagina
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
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center rounded-2xl border border-[#D9E2EC] bg-white px-5 py-8 text-center shadow-[0_16px_40px_rgba(0,55,145,0.10)] sm:px-6 sm:py-9">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl">
              No se encontraron coincidencias...
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Prueba con otra busqueda o ajusta los filtros para descubrir mas productos.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#D9E2EC] bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {shouldShowPagination ? (
          <nav
            aria-label="Paginacion de productos"
            className="mt-8 flex flex-col items-stretch justify-between gap-4 rounded-xl border border-[#D9E2EC] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(0,55,145,0.08)] sm:flex-row sm:items-center"
          >
            <p className="text-center text-sm font-semibold text-slate-600 sm:text-left">
              Pagina <span className="text-[#003791]">{page}</span> de{" "}
              <span className="text-[#003791]">{totalPages}</span>
            </p>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-72">
              {hasPreviousPage ? (
                <Link href={previousPageHref} className={activePaginationClassName}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              ) : (
                <span className={disabledPaginationClassName} aria-disabled="true">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </span>
              )}

              {hasNextPage ? (
                <Link href={nextPageHref} className={activePaginationClassName}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <span className={disabledPaginationClassName} aria-disabled="true">
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}