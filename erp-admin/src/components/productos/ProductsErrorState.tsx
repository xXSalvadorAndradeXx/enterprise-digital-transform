"use client";

import Image from "next/image";
import { RotateCw  } from "lucide-react";

interface ProductsErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ProductsErrorState({
  onRetry,
  isRetrying = false,
}: ProductsErrorStateProps) {
  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center"
      role="alert"
      aria-live="assertive"
    >
      <Image
        src="/images/alerta.svg"
        alt=""
        width={64}
        height={64}
        className="mb-4"
        aria-hidden="true"
      />

      <h2 className="text-base font-semibold text-gray-900">
        No se pudieron cargar los productos
      </h2>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Ocurrió un error al intentar cargar la información.
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[#FF413A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E93A34] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"      >
        <RotateCw
          size={16}
          className={isRetrying ? "animate-spin" : ""}
          aria-hidden="true"
        />

        {isRetrying ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}