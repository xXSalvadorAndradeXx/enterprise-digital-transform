"use client";

import type {
  ProductStatus,
  ProductUpdateStatus,
} from "@/types/productos";

interface ProductActionsProps {
  status: ProductStatus;

  isLoading?: boolean;

  onChangeStatus: (
    status: ProductUpdateStatus,
  ) => void | Promise<void>;
}

export function ProductActions({
  status,
  isLoading = false,
  onChangeStatus,
}: ProductActionsProps) {
  const canPublish =
    status === "DRAFT" ||
    status === "PAUSED";

  const canPause =
    status === "ACTIVE";

  const canDiscontinue =
    status !== "DISCONTINUED";

  return (
    <div className="flex flex-wrap gap-3">
      {canPublish && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            onChangeStatus(
              "ACTIVE",
            )
          }
          className="rounded-md bg-[#1C21D1] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Procesando..."
            : "Publicar"}
        </button>
      )}

      {canPause && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            onChangeStatus(
              "PAUSED",
            )
          }
          className="rounded-md border border-[#1C21D1] px-5 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Procesando..."
            : "Pausar"}
        </button>
      )}

      {canDiscontinue && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            onChangeStatus(
              "DISCONTINUED",
            )
          }
          className="rounded-md border border-red-500 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Descontinuar
        </button>
      )}

      {status ===
        "DISCONTINUED" && (
        <p className="text-sm text-gray-500">
          Este producto está descontinuado y no puede reactivarse.
        </p>
      )}
    </div>
  );
}