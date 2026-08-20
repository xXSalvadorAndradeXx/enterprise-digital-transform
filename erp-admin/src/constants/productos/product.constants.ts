export type ProductStockStatus =
  | "ACTIVE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

export const PRODUCT_STOCK_STATUS_OPTIONS: Array<{
  label: string;
  value: ProductStockStatus;
}> = [
  {
    label: "Alto",
    value: "ACTIVE",
  },
  {
    label: "Medio",
    value: "LOW_STOCK",
  },
  {
    label: "Bajo",
    value: "OUT_OF_STOCK",
  },
];

export const PRODUCT_CATEGORY_PLACEHOLDER =
  "Categoría";

export const PRODUCT_STATUS_PLACEHOLDER =
  "Estado";

export const PRODUCT_SEARCH_PLACEHOLDER =
  "Buscar productos";