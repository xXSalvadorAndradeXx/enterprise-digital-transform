type ProductStockStatusValue =
  | "ACTIVE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

interface ProductStockStatusProps {
  status: ProductStockStatusValue;
}

export function ProductStockStatus({
  status,
}: ProductStockStatusProps) {
  const label =
    status === "OUT_OF_STOCK"
      ? "Sin stock"
      : status === "LOW_STOCK"
        ? "Stock bajo"
        : "En stock";

  return (
    <span className="text-sm text-gray-600">
      {label}
    </span>
  );
}
