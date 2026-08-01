"use client";

import { useState } from "react";
import { FileEdit, Key } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export type UnlockOption = "desbloquear" | "desbloquear_reset";

export interface UnlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombreUsuario: string;
  onConfirm: (opcion: UnlockOption) => void;
}

const OPCIONES: { value: UnlockOption; label: string; icon: typeof Key; recomendado?: boolean }[] = [
  { value: "desbloquear", label: "Desbloquear acceso", icon: Key },
  {
    value: "desbloquear_reset",
    label: "Desbloquear y reestablecer contraseña",
    icon: FileEdit,
    recomendado: true,
  },
];

export function UnlockUserModal({ isOpen, onClose, nombreUsuario, onConfirm }: UnlockUserModalProps) {
  // La opción "Recomendado" viene seleccionada por defecto, igual que en el Figma.
  const [selected, setSelected] = useState<UnlockOption>("desbloquear_reset");

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Usuario bloqueado" headerDivider={false} size="md">
      <div className="text-center">
        <p className="mx-auto inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm text-gray-600">
          {nombreUsuario}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {OPCIONES.map((opcion) => {
            const isSelected = selected === opcion.value;
            return (
              <button
                key={opcion.value}
                type="button"
                onClick={() => setSelected(opcion.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-5 text-center transition-colors ${
                  isSelected ? "border-[#1C21D1] bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <opcion.icon size={22} className={isSelected ? "text-[#1C21D1]" : "text-gray-500"} />
                <span className={`text-sm font-medium leading-snug ${isSelected ? "text-[#1C21D1]" : "text-gray-700"}`}>
                  {opcion.label}
                  {opcion.recomendado && <span className="mt-1 block text-xs">(Recomendado)</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-[#1C21D1] px-4 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-md bg-[#1C21D1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}