"use client";

import {
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import type {
  CheckoutPreviewData,
} from "@/types/checkout/checkout.types";

import type {
  CheckoutPreviewError,
} from "@/hooks/checkout/useCheckoutPreview";

interface CheckoutPreviewProps {
  preview: CheckoutPreviewData | null;

  isLoading: boolean;

  error: CheckoutPreviewError | null;

  onRetry: () => Promise<
    CheckoutPreviewData | null
  >;
}

function formatMoney(
  value: string,
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return `$${amount.toFixed(2)}`;
}

function getErrorTitle(
  type: CheckoutPreviewError["type"],
) {
  switch (type) {
    case "INVALID_DELIVERY":
      return "Información de entrega inválida";

    case "INVALID_PAYMENT_COMBINATION":
      return "Método de pago no disponible";

    case "PRICE_CHANGED":
      return "El precio cambió";

    case "STOCK_INSUFFICIENT":
      return "Stock insuficiente";

    default:
      return "No se pudo actualizar el pedido";
  }
}

export function CheckoutPreview({
  preview,
  isLoading,
  error,
  onRetry,
}: CheckoutPreviewProps) {
  if (isLoading) {
    return (
      <aside
        aria-live="polite"
        className="w-full rounded-lg bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.20)]"
      >
        <h2 className="text-center text-xl font-semibold text-[#111827]">
          Resumen del pedido
        </h2>

        <div className="flex min-h-[220px] items-center justify-center">
          <p className="text-sm font-medium text-[#4b5563]">
            Actualizando valores del pedido...
          </p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside
        role="alert"
        className="w-full rounded-lg bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.20)]"
      >
        <div className="flex flex-col items-center text-center">
          <AlertTriangle
            className="h-9 w-9 text-[#ef4444]"
            aria-hidden="true"
          />

          <h2 className="mt-4 text-lg font-semibold text-[#111827]">
            {getErrorTitle(
              error.type,
            )}
          </h2>

          <p className="mt-2 max-w-[300px] text-sm font-medium leading-6 text-[#4b5563]">
            {error.message}
          </p>

          {error.type ===
            "PRICE_CHANGED" && (
            <p className="mt-3 max-w-[300px] text-xs font-medium leading-5 text-[#6b7280]">
              Revisa los valores
              actualizados antes de
              confirmar tu compra.
            </p>
          )}

          {error.type ===
            "STOCK_INSUFFICIENT" && (
            <p className="mt-3 max-w-[300px] text-xs font-medium leading-5 text-[#6b7280]">
              Ajusta las cantidades
              según el stock disponible
              y vuelve a intentarlo.
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              void onRetry()
            }
            className="mt-6 flex h-11 items-center justify-center gap-2 rounded-sm bg-[#2222e7] px-6 text-sm font-semibold text-white transition hover:bg-[#1919c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2222e7]"
          >
            <RefreshCcw
              className="h-4 w-4"
              aria-hidden="true"
            />

            Reintentar
          </button>
        </div>
      </aside>
    );
  }

  if (!preview) {
    return (
      <aside className="w-full rounded-lg bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.20)]">
        <h2 className="text-center text-xl font-semibold text-[#111827]">
          Resumen del pedido
        </h2>

        <div className="flex min-h-[220px] items-center justify-center text-center">
          <p className="max-w-[300px] text-sm font-medium leading-6 text-[#4b5563]">
            Completa la información
            necesaria para actualizar
            el resumen del pedido.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full rounded-lg bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.20)]">
      <h2 className="text-center text-xl font-semibold text-[#111827]">
        Resumen del pedido
      </h2>

      <div className="mt-8 space-y-5">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Subtotal:
          </span>

          <span className="text-base font-medium text-[#111827]">
            {formatMoney(
              preview.subtotal,
            )}
          </span>
        </div>

        {/* Descuento */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Descuento:
          </span>

          <span className="text-base font-medium text-[#111827]">
            -
            {formatMoney(
              preview.discountTotal,
            )}
          </span>
        </div>

        {/* Envío */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-[#4b4b4b]">
            Envío:
          </span>

          <span className="text-base font-medium text-[#111827]">
            {formatMoney(
              preview.shippingTotal,
            )}
          </span>
        </div>

        {/* Envío gratis */}
        {preview.freeShippingApplied && (
          <p className="text-right text-xs font-medium text-[#15803d]">
            Envío gratis aplicado
          </p>
        )}

        {/* Separador */}
        <div className="border-t border-black" />

        {/* Total */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-semibold text-[#111827]">
            Total
          </span>

          <span className="text-lg font-semibold text-[#111827]">
            {formatMoney(
              preview.total,
            )}
          </span>
        </div>
      </div>
    </aside>
  );
}