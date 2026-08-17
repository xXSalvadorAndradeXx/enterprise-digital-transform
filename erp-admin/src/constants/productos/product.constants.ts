import type { ProductStockStatus } from "@/types/productos";

export const PRODUCT_STOCK_STATUS_OPTIONS: Array<{
  label: ProductStockStatus;
  value: ProductStockStatus;
}> = [
  {
    label: "Alto",
    value: "Alto",
  },
  {
    label: "Medio",
    value: "Medio",
  },
  {
    label: "Bajo",
    value: "Bajo",
  },
];

export const PRODUCT_CATEGORY_PLACEHOLDER = "Categoría";

export const PRODUCT_STATUS_PLACEHOLDER = "Estado";

export const PRODUCT_SEARCH_PLACEHOLDER = "Buscar productos";