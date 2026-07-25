"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type PurchaseSuccessModalProps = {
  open: boolean;
  purchaseNumber: string;
  onAccept: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PurchaseSuccessModal({
  open,
  purchaseNumber,
  onAccept,
}: PurchaseSuccessModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    acceptButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onAccept();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      openerRef.current?.focus();
    };
  }, [open, onAccept]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-success-title"
        className="relative w-full max-w-md rounded-xl bg-white px-6 py-8 text-center shadow-2xl sm:px-10"
      >
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onAccept}
          className="absolute right-3 top-3 rounded p-1 text-[#4A4A4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#16A34A] text-white">
          <Check aria-hidden="true" size={48} strokeWidth={2.5} />
        </div>
        <h2
          id="purchase-success-title"
          className="mt-5 text-2xl font-bold text-[#15803D]"
        >
          ¡Compra registrada correctamente!
        </h2>
        <p className="mt-3 text-lg text-[#202124]">No. de compra: {purchaseNumber}</p>
        <button
          ref={acceptButtonRef}
          type="button"
          onClick={onAccept}
          className="mt-7 h-11 min-w-36 rounded-[5px] bg-[#15803D] px-6 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
