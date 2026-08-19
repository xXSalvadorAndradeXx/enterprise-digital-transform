"use client";

import {
  Trash2,
  X,
} from "lucide-react";

interface DeleteProductConfirmModalProps {
  isOpen: boolean;
  isLoading?: boolean;

  onCancel: () => void;

  onConfirm:
    () => Promise<void> | void;
}

export function DeleteProductConfirmModal({
  isOpen,
  isLoading = false,
  onCancel,
  onConfirm,
}: DeleteProductConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        className="relative w-full max-w-[620px] rounded-[18px] bg-white px-8 pb-8 pt-12 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cerrar modal"
          className="absolute right-7 top-6 text-gray-600 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X
            size={28}
            strokeWidth={3}
            aria-hidden="true"
          />
        </button>

        <div className="flex justify-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FFE1E1]">
            <Trash2
              size={38}
              strokeWidth={2.3}
              className="text-[#FF4242]"
              aria-hidden="true"
            />
          </div>
        </div>

        <h2
          id="delete-product-title"
          className="mt-7 text-center text-[27px] font-bold leading-tight text-black"
        >
          ¿Estás seguro que deseas eliminar este producto?
        </h2>

        <p className="mx-auto mt-7 max-w-[500px] text-center text-[17px] leading-7 text-gray-600">
          Una vez hecha esta acción, no se podrá deshacer.
          <br />
          El producto será retirado permanentemente del catálogo.
        </p>

        <div className="mt-10 flex flex-col-reverse items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[112px] rounded-md border border-[#1C21D1] bg-white px-6 py-3 text-base font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[112px] rounded-md bg-[#FA4245] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#E93A3D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Eliminando..."
              : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}