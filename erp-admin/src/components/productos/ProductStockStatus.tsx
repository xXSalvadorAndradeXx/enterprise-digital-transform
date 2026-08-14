import type { ProductStockStatus } from "@/types/productos";

interface ProductStockStatusProps {
  status: ProductStockStatus;
}

export function ProductStockStatus({
  status,
}: ProductStockStatusProps) {
  return (
    <span className="text-sm text-gray-600">
      {status}
    </span>
  );
}