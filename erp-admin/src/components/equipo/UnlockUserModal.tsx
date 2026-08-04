"use client";

import { useState } from "react";
import { FileEdit, KeyRound } from "lucide-react";

import { Modal } from "@/components/ui/Modal";

export type UnlockOption =
  | "desbloquear"
  | "desbloquear_reset";

export interface UnlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombreUsuario: string;
  onConfirm: (
    opcion: UnlockOption,
  ) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}

const OPCIONES: {
  value: UnlockOption;
  label: string;
  icon: typeof KeyRound;
  recomendado?: boolean;
}[] = [
  {
    value: "desbloquear",
    label: "Desbloquear acceso",
    icon: KeyRound,
  },
  {
    value: "desbloquear_reset",
    label:
      "Desbloquear y restablecer contraseña",
    icon: FileEdit,
    recomendado: true,
  },
];

export function UnlockUserModal({
  isOpen,
  onClose,
  nombreUsuario,
  onConfirm,
  isLoading = false,
  error = null,
}: UnlockUserModalProps) {
  const [selected, setSelected] =
    useState<UnlockOption>(
      "desbloquear_reset",
    );

  const handleClose = () => {
    if (isLoading) {
      return;
    }

    setSelected("desbloquear_reset");
    onClose();
  };

  const handleConfirm = async (): Promise<void> => {
    await onConfirm(selected);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Usuario bloqueado"
      headerDivider={false}
      size="md"
    >
      <div className="text-center">
        <p className="mx-auto inline-block rounded-[10px] bg-indigo-50 px-5 py-2 text-sm text-gray-700">
          {nombreUsuario}
        </p>

        <p className="mt-4 text-sm text-black">
          Selecciona cómo deseas desbloquear
          esta cuenta.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPCIONES.map((opcion) => {
            const isSelected =
              selected === opcion.value;

            const Icon = opcion.icon;

            return (
              <button
                key={opcion.value}
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setSelected(opcion.value)
                }
                className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? "border-[#1C21D1] bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Icon
                  size={22}
                  className={
                    isSelected
                      ? "text-black"
                      : "text-gray-500"
                  }
                />

                <span
                  className={`text-sm font-medium leading-snug ${
                    isSelected
                      ? "text-black"
                      : "text-gray-700"
                  }`}
                >
                  {opcion.label}

                  {opcion.recomendado && (
                    <span className="mt-1 block text-xs">
                      (Recomendado)
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="w-36 rounded-md border border-[#1C21D1] py-2 text-sm font-medium text-[#080808] transition-colors hover:bg-indigo-50"
        >
          Cerrar
        </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-36 rounded-md bg-[#1C21D1] py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD]"
          >
            {isLoading
              ? "Procesando..."
              : "Confirmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}