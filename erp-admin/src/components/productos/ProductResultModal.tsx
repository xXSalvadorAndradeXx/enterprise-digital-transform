"use client";

import {
  Check,
  Info,
  X,
} from "lucide-react";

interface ProductResultModalProps {
  isOpen: boolean;

  type:
    | "success"
    | "error";

  title: string;

  message: string;

  onClose: () => void;

  onRetry?: () => void;

  errorActionLabel?: string;
}

export function ProductResultModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onRetry,
  errorActionLabel = "Reintentar",
}: ProductResultModalProps) {
  if (!isOpen) {
    return null;
  }

  const isSuccess =
    type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-result-title"
        className="relative w-full max-w-lg rounded-2xl bg-white px-8 py-7 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute right-6 top-5 text-gray-600 hover:text-gray-900"
        >
          <X
            size={25}
            aria-hidden="true"
          />
        </button>

        <div className="flex justify-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              isSuccess
                ? "bg-green-500 text-white"
                : "bg-yellow-300 text-gray-950"
            }`}
          >
            {isSuccess ? (
              <Check
                size={32}
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : (
              <Info
                size={30}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <h2
          id="product-result-title"
          className="mt-6 text-center text-xl font-bold text-gray-950"
        >
          {title}
        </h2>

        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-6 text-gray-600">
          {message}
        </p>

        <div className="mt-7 flex justify-center">
          {isSuccess ? (
            <button
              type="button"
              onClick={onClose}
              className="min-w-32 rounded-md bg-[#1C21D1] px-5 py-2.5 text-sm font-medium text-white"
            >
              Aceptar
            </button>
          ) : (
            <button
              type="button"
              onClick={
                onRetry ??
                onClose
              }
              className="min-w-32 rounded-md border border-[#1C21D1] px-5 py-2.5 text-sm font-medium text-[#1C21D1]"
            >
              {errorActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
