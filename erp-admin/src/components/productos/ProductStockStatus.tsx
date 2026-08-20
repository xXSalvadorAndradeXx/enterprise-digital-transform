type ProductStockStatusValue =
  | "ALTO"
  | "MEDIO"
  | "BAJO";

interface ProductStockStatusProps {
  status: ProductStockStatusValue;
}

export function ProductStockStatus({
  status,
}: ProductStockStatusProps) {
  const label =
    status === "ALTO"
      ? "Alto"
      : status === "MEDIO"
        ? "Medio"
        : "Bajo";

  const className =
    status === "ALTO"
      ? "bg-green-100 text-green-700"
      : status === "MEDIO"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex min-w-20 justify-center rounded-md px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
