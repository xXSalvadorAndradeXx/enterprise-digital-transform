"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Producto y totales de vista previa (maqueta, tarea 831). Cuando se
// conecte al backend real vienen de GET /cart y POST /checkout/preview
// (contrato §8 y §9.1).
const MOCK_ITEM = {
  productName: "Nike Free Metcon 7",
  imageUrl: "https://via.placeholder.com/128x128.png?text=Nike",
  unitPrice: "209.32",
};

const MOCK_TOTALS = {
  subtotal: "209.32",
  shippingTotal: null as string | null,
  total: "209.32",
};

interface Props {
  onContinue: () => void;
}

// Desktop: sticky al hacer scroll. Móvil: colapsado detrás de un botón
// "Resumen" accesible (aria-expanded/aria-controls) — criterio de la tarea 831.
export default function CheckoutSummary({ onContinue }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside className="h-fit rounded-lg border border-gray-200 bg-white lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="checkout-summary-panel"
        className="flex w-full items-center justify-between px-5 py-3 text-sm text-gray-500 lg:hidden"
      >
        Resumen
        <ChevronDown
          className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div
        id="checkout-summary-panel"
        className={`${mobileOpen ? "block" : "hidden"} border-t border-gray-100 px-5 py-5 lg:block lg:border-t-0`}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- cambiar a next/image cuando el host esté en next.config.ts */}
          <img
            src={MOCK_ITEM.imageUrl}
            alt={MOCK_ITEM.productName}
            className="h-16 w-16 rounded-md object-cover"
          />
          <p className="text-sm font-medium text-gray-900">{MOCK_ITEM.productName}</p>
          <span className="ml-auto text-sm font-medium text-gray-900">${MOCK_ITEM.unitPrice}</span>
        </div>

        <div className="mt-5 rounded-md border border-gray-200 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">Resumen del pedido</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd>${MOCK_TOTALS.subtotal}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Envío:</dt>
              <dd>{MOCK_TOTALS.shippingTotal ? `$${MOCK_TOTALS.shippingTotal}` : "----------"}</dd>
            </div>
          </dl>
          <div className="my-3 border-t border-gray-200" />
          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Total a pagar:</span>
            <span>${MOCK_TOTALS.total}</span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 w-full rounded-md bg-[#1B21D1] py-2.5 text-sm font-medium text-white transition hover:bg-[#1519A3]"
          >
            Continuar
          </button>
        </div>
      </div>
    </aside>
  );
}
