"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
  className?: string;
  titleClassName?: string;
}

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  showCloseButton = true,
  className = "",
  titleClassName = "",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`relative w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl ${className}`}
      >

        {showCloseButton && (
  <button
    onClick={onClose}
    className="absolute right-5 top-5 text-gray-500 hover:text-black"
  >
    <X size={22} />
  </button>
   )}

        {title && (
          <h2
            className={`mb-6 text-4xl font-semibold text-[#1E1E1E] ${titleClassName}`}
          >
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
