"use client";

import { Info } from "lucide-react";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { PasswordRevealBox } from "@/components/ui/PasswordRevealBox";

export interface UsuarioAgregadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: string;
  contrasenaTemporal: string;
}

export function UsuarioAgregadoModal({ isOpen, onClose, usuario, contrasenaTemporal }: UsuarioAgregadoModalProps) {
  return (
    <SuccessModal
      isOpen={isOpen}
      onClose={onClose}
      title="¡Usuario agregado con éxito!"
      description="Se ha creado el nuevo usuario y se han generado sus credenciales de acceso temporal para el empleado."
      primaryActionLabel="Cerrar"
    >
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
        <p className="text-sm font-semibold text-gray-900">Credenciales de acceso</p>
        <p className="mt-2 text-sm font-medium text-gray-900">
          Usuario: <span className="font-normal text-gray-600">{usuario}</span>
        </p>
        <p className="mt-2 text-sm font-medium text-gray-900">Contraseña temporal:</p>
        <div className="mt-1">
          <PasswordRevealBox password={contrasenaTemporal} />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
        <p>
          El empleado deberá iniciar sesión con esta contraseña temporal y crear una nueva contraseña personal para
          continuar utilizando el sistema.
        </p>
      </div>
    </SuccessModal>
  );
}