"use client";

import { useRouter } from "next/navigation";

interface CartSummaryProps {
  subtotal: number;
  discountTotal: number;
  preliminaryTotal: number;
  totalItems: number;
  disabled?: boolean;
}

export function CartSummary({
  subtotal,
  discountTotal,
  preliminaryTotal,
  totalItems,
  disabled = false,
}: CartSummaryProps) {
  const router = useRouter();

  const handleContinueShopping = () => {
    router.push("/productos");
  };

  return (
    <aside className="w-full rounded-lg bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.20)]">
      <h2 className="text-center text-xl font-semibold text-[#111827]">
        Resumen del pedido
      </h2>

      <div className="mt-8 space-y-5">
        {/* Cantidad de artículos */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Artículos:
          </span>

          <span className="text-base font-medium text-[#111827]">
            {totalItems}
          </span>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Subtotal:
          </span>

          <span className="text-base font-medium text-[#111827]">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Descuento */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Descuento:
          </span>

          <span className="text-base font-medium text-[#111827]">
            -${discountTotal.toFixed(2)}
          </span>
        </div>

        {/* Separador */}
        <div className="border-t border-black" />

        {/* Total preliminar */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-semibold text-[#111827]">
            Total preliminar
          </span>

          <span className="text-lg font-semibold text-[#111827]">
            ${preliminaryTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-9">
        <button
          type="button"
          disabled={disabled || totalItems === 0}
          aria-disabled={disabled || totalItems === 0}
          className="
            mx-auto block h-11 w-[90%] rounded-sm
            bg-[#2222e7]
            text-sm font-semibold text-white
            transition
            hover:bg-[#1919c7]
            disabled:cursor-not-allowed
            disabled:bg-[#a8a8ee]
            disabled:hover:bg-[#a8a8ee]
          "
        >
          Comprar pedido
        </button>

        <button
          type="button"
          onClick={handleContinueShopping}
          className="mt-4 w-full text-center text-sm font-semibold text-[#111827] underline underline-offset-2"
        >
          Continuar comprando
        </button>
      </div>
    </aside>
  );
}