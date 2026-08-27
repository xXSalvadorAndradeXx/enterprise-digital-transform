import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import ProductSort from "@/components/products/ProductSort";
import type { ProductFilterValues } from "@/components/products/ProductFilters";
import type { Product, ProductCategory, ProductsResponse } from "@/types/products/product.types";

const API_BASE_URL = "http://localhost:3000/api/v1";
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
    brand: readParam(searchParams, "brand"),
    gender: readParam(searchParams, "gender"),
    size: readParam(searchParams, "size"),
    minPrice: readNonNegativeNumberParam(searchParams, "minPrice"),
    maxPrice: readNonNegativeNumberParam(searchParams, "maxPrice"),
    availability: readParam(searchParams, "availability"),
    hasDiscount: readParam(searchParams, "hasDiscount"),
    sortBy: readParam(searchParams, "sortBy") || "createdAt",
    order: readParam(searchParams, "order") || "DESC",
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
    filters.search || filters.categoryId || filters.brand || filters.gender || filters.size || filters.minPrice || filters.maxPrice || filters.availability || filters.hasDiscount,
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

  for (const key of ["brand", "gender", "size", "availability", "hasDiscount", "sortBy", "order"] as const) {
    if (filters[key]) queryParams.set(key, filters[key]);
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
  const productsUrl = new URL(`${API_BASE_URL}/ecommerce/products`);

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

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, "ellipsis", totalPages - 1, totalPages] as const;
  if (currentPage >= totalPages - 1) return [1, 2, "ellipsis", totalPages - 1, totalPages] as const;
  return [1, "ellipsis-start", currentPage, "ellipsis-end", totalPages] as const;
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

    const rawResponseData = (await response.json()) as
      | ProductsResponse
      | {
          success?: boolean;
          data?: ProductsResponse;
        };
    const responseData = (
      "success" in rawResponseData &&
      rawResponseData.success === true &&
      rawResponseData.data
        ? rawResponseData.data
        : rawResponseData
    ) as ProductsResponse | { data?: { items?: Product[]; meta?: { total?: number; page?: number; limit?: number } }; meta?: { total?: number; page?: number; limit?: number } };
    const payload = responseData.data;
    const products = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    const rootMeta = "meta" in responseData ? responseData.meta : undefined;
    const total =
      "total" in responseData && typeof responseData.total === "number" ? responseData.total : (typeof rootMeta?.total === "number" ? rootMeta.total : (!Array.isArray(payload) && typeof payload?.meta?.total === "number" ? payload.meta.total : products.length));
    const page =
      "page" in responseData && typeof responseData.page === "number" ? responseData.page : (typeof rootMeta?.page === "number" ? rootMeta.page : (!Array.isArray(payload) && typeof payload?.meta?.page === "number" ? payload.meta.page : pagination.page));
    const limit =
      "limit" in responseData && typeof responseData.limit === "number"
        ? responseData.limit
        : (typeof rootMeta?.limit === "number" ? rootMeta.limit : (!Array.isArray(payload) && typeof payload?.meta?.limit === "number" ? payload.meta.limit : pagination.limit));

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
    const response = await fetch(`${API_BASE_URL}/categories?publishedOnly=true`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ProductCategory[] | { data?: ProductCategory[] };
    const categories = Array.isArray(payload) ? payload : payload.data;
    return Array.isArray(categories) ? categories.map(category => ({ ...category, nombre: category.nombre ?? category.name ?? "" })) : [];
  } catch {
    return [];
  }
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = readProductFilters(resolvedSearchParams);
  const pagination = readProductPagination(resolvedSearchParams);
  const filtersKey = [
    filters.search,
    filters.categoryId,
    filters.brand,
    filters.gender,
    filters.size,
    filters.minPrice,
    filters.maxPrice,
    filters.availability,
    filters.hasDiscount,
  ].join("-");
  const filtersAreActive = hasActiveFilters(filters);
  const [productsResult, categories] = await Promise.all([
    getProducts(filters, pagination),
    getCategories(),
  ]);
  const { products, total, page, limit, errorMessage } = productsResult;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const shouldShowPagination = !errorMessage && total > 0;
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
  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-white px-4 py-6 text-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <nav className="flex items-center gap-2 bg-[#f2f5fb] px-5 py-4 text-xs text-slate-600" aria-label="Ruta de navegación">
          <Link href="/" className="transition-colors hover:text-[#1822d9] hover:underline">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="font-medium text-slate-900">Productos</span>
        </nav>
        <div className="mt-6 border-b border-[#e5e7eb] pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              Productos
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ProductFilters key={filtersKey} categories={categories} initialFilters={filters} />
          <div className="min-w-0">
        {!errorMessage ? (
          <div className="mb-6 flex flex-col gap-3 border-b border-[#eef0f4] pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} De {total} Resultados
            </p>
            <ProductSort value={filters.sortBy} order={filters.order} />
          </div>
        ) : null}

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
              Prueba con otra búsqueda o ajusta los filtros para descubrir más productos.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#D9E2EC] bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {shouldShowPagination ? (
          <nav
            aria-label="Paginacion de productos"
            className="mx-auto mt-12 flex w-fit items-center gap-1 rounded border border-[#edf0f4] bg-white p-2"
          >
            {hasPreviousPage?<Link href={previousPageHref} aria-label="Página anterior" className="flex h-10 w-10 items-center justify-center"><ChevronLeft className="h-5 w-5"/></Link>:<span aria-disabled="true" className="flex h-10 w-10 items-center justify-center text-slate-300"><ChevronLeft className="h-5 w-5"/></span>}
            {paginationItems.map(item=>typeof item==="number"?<Link key={item} href={buildProductsPageHref(filters,{page:item,limit})} aria-current={item===page?"page":undefined} className={`flex h-10 min-w-10 items-center justify-center rounded px-3 text-sm ${item===page?"bg-[#f5f5f6] font-semibold":"hover:bg-[#f8f8f8]"}`}>{item}</Link>:<span key={item} className="flex h-10 min-w-10 items-center justify-center">...</span>)}
            {hasNextPage?<Link href={nextPageHref} aria-label="Página siguiente" className="flex h-10 w-10 items-center justify-center"><ChevronRight className="h-5 w-5"/></Link>:<span aria-disabled="true" className="flex h-10 w-10 items-center justify-center text-slate-300"><ChevronRight className="h-5 w-5"/></span>}
          </nav>
        ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
