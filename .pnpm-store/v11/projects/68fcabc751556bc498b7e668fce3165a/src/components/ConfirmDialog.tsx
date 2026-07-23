"use client";

import { Loader2 } from "lucide-react";

type ConfirmDialogVariant = "danger" | "primary";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  const confirmClassName =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-[#003791] text-white hover:bg-[#005BFF]";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111111]/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-[0_24px_70px_rgba(17,17,17,0.22)] sm:p-6">
        <h2 className="text-xl font-extrabold text-[#111111]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${confirmClassName}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
