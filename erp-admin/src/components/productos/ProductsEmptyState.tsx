"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductsEmptyState() {
  const router = useRouter();

  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/images/bandeja.svg"
        alt=""
        width={64}
        height={64}
        className="mb-4"
        aria-hidden="true"
      />

      <h2 className="text-base font-semibold text-gray-900">
        No hay productos aún.
      </h2>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Agrega tu primer producto para comenzar a gestionar el catálogo.
      </p>

      <button
        type="button"
        onClick={() => router.push("/productos/publicar")}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#1C21D1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      >
        <Plus
          size={16}
          aria-hidden="true"
        />

        Agregar producto
      </button>
    </div>
  );
}