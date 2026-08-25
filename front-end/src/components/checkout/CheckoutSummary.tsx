"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { CheckoutPreviewResponse } from "@/types/checkout/checkout.types";

interface Props {
  preview: CheckoutPreviewResponse | null;
  onContinue: () => void;
}

export default function CheckoutSummary({
  preview,
  onContinue,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside className="h-fit rounded-lg border border-gray-200 bg-white lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        aria-expanded={mobileOpen}
        aria-controls="checkout-summary-panel"
        className="flex w-full items-center justify-between px-5 py-3 text-sm text-gray-500 lg:hidden"
      >
        Resumen

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            mobileOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id="checkout-summary-panel"
        className={`${
          mobileOpen ? "block" : "hidden"
        } border-t border-gray-100 px-5 py-5 lg:block lg:border-t-0`}
      >
        <div className="rounded-md border border-gray-200 p-4">
          <p className="mb-4 text-sm font-semibold text-gray-800">
            Resumen del pedido
          </p>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd>${preview?.subtotal ?? "0.00"}</dd>
            </div>

            <div className="flex justify-between text-gray-600">
              <dt>Descuento</dt>
              <dd>-${preview?.discountTotal ?? "0.00"}</dd>
            </div>

            <div className="flex justify-between text-gray-600">
              <dt>Envío</dt>
              <dd>
                ${preview?.shippingTotal ?? "0.00"}
              </dd>
            </div>
          </dl>

          <div className="my-4 border-t border-gray-200" />

          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Total a pagar:</span>
            <span>${preview?.total ?? "0.00"}</span>
          </div>

          {preview?.freeShippingApplied && (
            <p className="mt-2 text-xs text-green-600">
              Envío gratis aplicado
            </p>
          )}

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