import type { ProductStatus } from "@/types/productos";

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

const STATUS_LABELS: Record<
  ProductStatus,
  string
> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  DISCONTINUED: "Descontinuado",
};

const STATUS_CLASSES: Record<
  ProductStatus,
  string
> = {
  DRAFT:
    "bg-gray-100 text-gray-700",
  ACTIVE:
    "bg-green-100 text-green-700",
  PAUSED:
    "bg-amber-100 text-amber-700",
  DISCONTINUED:
    "bg-red-100 text-red-700",
};

export function ProductStatusBadge({
  status,
}: ProductStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}