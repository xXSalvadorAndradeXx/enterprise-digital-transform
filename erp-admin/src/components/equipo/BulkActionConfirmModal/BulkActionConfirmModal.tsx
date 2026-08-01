"use client";

import { useEffect } from "react";
import { ShieldAlert, Trash2, Users } from "lucide-react";
import type { BulkActionConfirmModalProps, BulkActionType } from "./BulkActionConfirmModal.types";

interface ActionConfig {
  icon: typeof Users;
  title: string;
  actionLabel: string;
  warningText: string;
  confirmLabel: string;
  iconBg: string;
  iconColor: string;
  highlight: string;
  confirmButton: string;
}

const ACTION_CONFIG: Record<BulkActionType, ActionConfig> = {
  deactivate: {
    icon: Users,
    title: "Desactivar usuarios",
    actionLabel: "desactivar",
    warningText: "Esta acción limitará el acceso de los usuarios seleccionados al sistema.",
    confirmLabel: "Confirmar desactivación",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    highlight: "text-indigo-600",
    confirmButton: "bg-[#1C21D1] hover:bg-[#171AAD]",
  },
  delete: {
    icon: Trash2,
    title: "Eliminar usuarios",
    actionLabel: "eliminar",
    warningText: "Esta acción eliminará permanentemente a los usuarios seleccionados del sistema.",
    confirmLabel: "Confirmar eliminación",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    highlight: "text-red-600",
    confirmButton: "bg-red-600 hover:bg-red-700",
  },
};

export function BulkActionConfirmModal({
  isOpen,
  action,
  users,
  isLoading = false,
  onClose,
  onConfirm,
}: BulkActionConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;
  const count = users.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${config.iconBg}`}>
          <Icon size={32} className={config.iconColor} />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-gray-900">{config.title}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Se {count === 1 ? "ha" : "han"} seleccionado{" "}
          <span className={`font-medium ${config.highlight}`}>
            {count} usuario{count === 1 ? "" : "s"}
          </span>{" "}
          para {config.actionLabel}.
        </p>

        {/* max-h + overflow para cuando la selección sea grande — el Figma no
            lo muestra, pero sin esto el modal crecería sin límite. */}
        <div className="mt-4 max-h-48 space-y-3 overflow-y-auto text-left">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500">
              {user.nombre}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-indigo-50 p-4 text-left">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-indigo-600" />
          <p className="text-sm text-gray-700">{config.warningText}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#1C21D1] px-6 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-md px-6 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${config.confirmButton}`}
          >
            {isLoading ? "Procesando..." : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}