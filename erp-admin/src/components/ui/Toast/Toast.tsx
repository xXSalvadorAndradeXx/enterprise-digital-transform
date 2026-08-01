"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ToastProps } from "./Toast.types";

export function Toast({
  isOpen,
  title,
  description,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 top-6 z-100 w-full max-w-105 px-4 sm:px-0"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="absolute inset-y-0 left-0 w-3 bg-[#55B559]" />

        <div className="flex items-start gap-4 py-4 pl-9 pr-12">
          <div>
            <p className="text-base font-bold text-gray-900">
              {title}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="absolute right-4 top-4 text-gray-800 transition-colors hover:text-gray-500"
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}