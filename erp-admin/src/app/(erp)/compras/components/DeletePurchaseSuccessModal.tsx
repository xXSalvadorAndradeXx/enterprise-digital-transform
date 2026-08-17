"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

type DeletePurchaseSuccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeletePurchaseSuccessModal({
  open,
  onClose,
}: DeletePurchaseSuccessModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-success-title"
        className="w-full max-w-md rounded-xl bg-white px-6 py-8 text-center shadow-2xl sm:px-10"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#16A34A] text-white">
          <Check aria-hidden="true" size={48} strokeWidth={2.5} />
        </div>
        <h2
          id="delete-success-title"
          className="mt-5 text-2xl font-bold text-[#15803D]"
        >
          Compra eliminada correctamente
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="mt-7 h-11 min-w-36 rounded-[5px] bg-[#15803D] px-6 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
