import { Percent } from "lucide-react";

import { formatCurrency } from "@/utils/formatCurrency";

interface ProductDiscountCardProps {
  salePrice: number;
  discount: number;
  effectivePrice: number;
}

export function ProductDiscountCard({
  salePrice,
  discount,
  effectivePrice,
}: ProductDiscountCardProps) {
  if (discount <= 0) {
    return null;
  }

  const savings = Math.max(
    0,
    salePrice - effectivePrice,
  );

  return (
    <section
      aria-label="Descuento del producto"
      className="space-y-3"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        Información de descuento
      </h3>

      <div className="rounded-lg border border-gray-300 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(255,218,226,0.85)] text-[#EC2A51]">
            <Percent
              size={23}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              Descuento activo
            </p>

            <p className="text-sm text-gray-600">
              {discount}% de descuento
            </p>
          </div>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-lg border border-gray-300 sm:grid-cols-[1fr_1fr_auto]">
        <div className="border-b border-gray-300 p-3 sm:border-b-0 sm:border-r">
          <p className="text-sm font-semibold text-gray-900">
            Precio original
          </p>

          <p className="mt-1 text-sm text-gray-600">
            {formatCurrency(salePrice)}
          </p>
        </div>

        <div className="border-b border-gray-300 p-3 sm:border-b-0 sm:border-r">
          <p className="text-sm font-semibold text-gray-900">
            Precio con descuento
          </p>

          <p className="mt-1 font-semibold text-[#1C21D1]">
            {formatCurrency(
              effectivePrice,
            )}
          </p>
        </div>

        <div className="flex items-center justify-center p-3">
        <span className="inline-flex items-center justify-center rounded-lg bg-[rgba(255,218,226,0.85)] px-3 py-2 text-sm font-bold text-[#EC2A51]">
        Ahorras {formatCurrency(savings)}
        </span>
        </div>
      </div>
    </section>
  );
}