"use client";

import {
  Check,
  Info,
  Tag,
  X,
} from "lucide-react";

interface ConfirmDiscountModalProps {
  isOpen: boolean;

  discount: number;

  originalPrice: number;

  discountAmount: number;

  previewPrice: number;

  onCancel: () => void;

  onConfirm: () => void;

  isLoading?: boolean;
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

export function ConfirmDiscountModal({
  isOpen,
  discount,
  originalPrice,
  discountAmount,
  previewPrice,
  onCancel,
  onConfirm,
  isLoading = false,
}: ConfirmDiscountModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-discount-title"
        className="relative w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cerrar confirmación de descuento"
          className="absolute right-6 top-5 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <X
            size={26}
            aria-hidden="true"
          />
        </button>

        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
            <Check
              size={32}
              strokeWidth={3}
              aria-hidden="true"
            />
          </div>
        </div>

        <h2
          id="confirm-discount-title"
          className="mt-6 text-center text-2xl font-bold text-gray-950"
        >
          Confirmar descuento
        </h2>

        <p className="mx-auto mt-4 max-w-md text-center text-base text-gray-600">
          Revisa la información del descuento antes de continuar.
        </p>

        <div className="mt-7 flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-600">
          <Tag
            size={22}
            aria-hidden="true"
          />

          <span className="font-medium">
            {discount}% de descuento
          </span>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-5">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-800">
              Precio original
            </span>

            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(
                originalPrice,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 py-3 text-green-600">
            <span className="text-sm">
              Descuento ({discount}%)
            </span>

            <span className="text-sm">
              -
              {formatCurrency(
                discountAmount,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="font-semibold text-gray-950">
              Total
            </span>

            <span className="font-bold text-gray-950">
              {formatCurrency(
                previewPrice,
              )}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#F2F5FC] px-4 py-4 text-sm text-gray-900">
          <Info
            size={21}
            className="shrink-0 text-[#1C21D1]"
            aria-hidden="true"
          />

          <span>
            El descuento seleccionado se aplicará al producto.
          </span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-28 rounded-md border border-[#1C21D1] px-5 py-2.5 text-sm font-medium text-[#1C21D1] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-28 rounded-md bg-[#1C21D1] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Procesando..."
              : "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}
