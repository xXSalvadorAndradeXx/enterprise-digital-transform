"use client";

import { useEffect } from "react";
import Image from "next/image";
import { SuccessModalProps } from "./Successmodal.types";

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  primaryActionLabel = "Aceptar",
  onPrimaryAction,
}: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrimary = () => {
    onPrimaryAction?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        {/* TODO: confirma que el archivo quede exactamente en esta ruta,
            o ajusta el `src` si le pusiste otro nombre/carpeta dentro de public/. */}
        <Image
          src="/images/success-check.svg"
          alt=""
          width={256}
          height={94}
          className="mx-auto h-auto w-64"
        />

        <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        {children && <div className="mt-4 text-left">{children}</div>}

        <button
          type="button"
          onClick={handlePrimary}
          className="mt-6 rounded-md bg-[#1C21D1] px-8 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD]"
        >
          {primaryActionLabel}
        </button>
      </div>
    </div>
  );
}