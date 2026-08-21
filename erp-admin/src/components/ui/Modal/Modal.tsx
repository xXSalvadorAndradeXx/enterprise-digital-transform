"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ModalProps } from "./Modal.types";

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  fields,
  footer,
  children,
  size = "xl",
  headerDivider = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto ${SIZE_CLASSES[size]} rounded-2xl bg-white p-4 shadow-xl sm:p-6`}
      >
        <div className={`mb-2 flex items-center justify-between pb-4 ${headerDivider ? "border-b border-gray-300" : ""}`}>
          <h2 id="modal-title" className="pr-3 text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-red-500 transition-colors hover:text-red-600"
          >
            <X size={22} />
          </button>
        </div>

        <div>
          {children
            ? children
            : fields?.map((field, index) => (
                <div
                  key={field.label}
                  className={`py-4 ${index < fields.length - 1 ? "border-b border-gray-300" : "pb-0"}`}
                >
                  <p className="text-base font-semibold text-gray-900">{field.label}</p>
                  <p className="mt-1 text-base text-gray-500">{field.value}</p>
                </div>
              ))}
        </div>

        {footer && <div className="mt-6 flex w-full items-center gap-3">{footer}</div>}
      </div>
    </div>
  );
}
