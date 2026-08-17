"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

type DeletePurchaseConfirmModalProps = {
  open: boolean;
  reference: string;
  returnFocusTo: HTMLElement | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function DeletePurchaseConfirmModal({
  open,
  reference,
  returnFocusTo,
  onCancel,
  onConfirm,
}: DeletePurchaseConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (returnFocusTo?.isConnected) returnFocusTo.focus();
    };
  }, [open, onCancel, returnFocusTo]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-purchase-title"
        aria-describedby="delete-purchase-reference"
        className="w-full max-w-md rounded-xl bg-white px-6 py-8 text-center shadow-2xl sm:px-10"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600">
          <TriangleAlert aria-hidden="true" size={46} strokeWidth={2.2} />
        </div>
        <h2
          id="delete-purchase-title"
          className="mt-5 text-2xl font-bold text-[#202124]"
        >
          ¿Estás seguro de eliminar esta compra?
        </h2>
        <p id="delete-purchase-reference" className="mt-3 text-lg text-[#202124]">
          No. de compra: {reference}
        </p>
        <div className="mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="h-11 min-w-32 rounded-[5px] border border-red-600 bg-white px-6 font-semibold text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 min-w-32 rounded-[5px] bg-red-600 px-6 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
