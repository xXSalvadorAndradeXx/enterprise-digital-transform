import type {
  ProductQuery,
} from "@/types/productos";

export function buildProductQueryString(
  query: ProductQuery,
): string {
  const params =
    new URLSearchParams();

  if (
    query.page !== undefined
  ) {
    params.set(
      "page",
      String(query.page),
    );
  }

  if (
    query.limit !== undefined
  ) {
    params.set(
      "limit",
      String(query.limit),
    );
  }

  if (
    query.search?.trim()
  ) {
    params.set(
      "search",
      query.search.trim(),
    );
  }

  if (query.stockStatus) {
    params.set(
      "stockStatus",
      query.stockStatus,
    );
  }

  if (
    query.supplierId
  ) {
    params.set(
      "supplierId",
      query.supplierId,
    );
  }

  if (
    query.categoryId
  ) {
    params.set(
      "categoryId",
      query.categoryId,
    );
  }

  if (query.tag?.trim()) {
    params.set(
      "tag",
      query.tag.trim(),
    );
  }

  if (
    query.minPrice !== undefined
  ) {
    params.set(
      "minPrice",
      String(
        query.minPrice,
      ),
    );
  }

  if (
    query.maxPrice !== undefined
  ) {
    params.set(
      "maxPrice",
      String(
        query.maxPrice,
      ),
    );
  }

  if (query.sortBy) {
    params.set(
      "sortBy",
      query.sortBy,
    );
  }

  if (query.order) {
    params.set(
      "order",
      query.order,
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}
