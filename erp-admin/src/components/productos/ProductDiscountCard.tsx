import { Percent } from "lucide-react";

import { formatCurrency } from "@/utils/formatCurrency";

interface ProductDiscountCardProps {
  salePrice: number;
  discount: number;
  effectivePrice: number;
}

export function ProductDiscountCard({
  salePrice,
  discount = 0,
  effectivePrice,
}: ProductDiscountCardProps) {
  const isDiscountActive = discount > 0;
  const currentEffectivePrice = isDiscountActive ? effectivePrice : 0;
  const savings = isDiscountActive ? Math.max(0, salePrice - effectivePrice) : 0;

  return (
    <section
      aria-label="Descuento del producto"
      className="space-y-3"
    >
      <h3 className="mb-4 text-base font-bold text-gray-900">
        Información básica
      </h3>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FDD8E8] text-[#B80A18]">
            <Percent
              size={20}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900">
              Descuento activo
            </p>

            <p className="text-xs text-gray-500">
              {discount}% de descuento
            </p>
          </div>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-lg border border-gray-200 bg-white sm:grid-cols-[1fr_1.2fr_auto]">
        <div className="border-b border-gray-200 p-3.5 sm:border-b-0 sm:border-r">
          <p className="text-xs font-semibold text-gray-900">
            Precio original
          </p>

          <p className="mt-1 text-sm font-medium text-gray-600">
            {formatCurrency(salePrice)}
          </p>
        </div>

        <div className="border-b border-gray-200 p-3.5 sm:border-b-0 sm:border-r">
          <p className="text-xs font-semibold text-gray-900">
            Precio con descuento
          </p>

          <p className="mt-1 text-sm font-bold text-[#B80A18]">
            {isDiscountActive ? formatCurrency(currentEffectivePrice) : "$00.00"}
          </p>
        </div>

        <div className="flex items-center justify-center p-3.5">
          <span className="inline-flex items-center justify-center rounded-md bg-[#FDD8E8] px-2.5 py-1.5 text-xs font-bold text-[#B80A18]">
            Ahorras {formatCurrency(savings)}
          </span>
        </div>
      </div>
    </section>
  );
}