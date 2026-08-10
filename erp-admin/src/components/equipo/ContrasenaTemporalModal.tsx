"use client";

import { Info } from "lucide-react";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { PasswordRevealBox } from "@/components/ui/PasswordRevealBox";

export interface ContrasenaTemporalModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: string;
  contrasenaTemporal: string;
}

export function ContrasenaTemporalModal({ isOpen, onClose, usuario, contrasenaTemporal }: ContrasenaTemporalModalProps) {
  return (
    <SuccessModal
      isOpen={isOpen}
      onClose={onClose}
      title="¡Contraseña temporal generada con éxito!"
      description="Se ha generado una contraseña temporal para el usuario. Comparte esta información de forma segura para que pueda acceder nuevamente a su cuenta."
    >
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
        <p className="text-sm font-semibold text-gray-900">Credenciales de acceso</p>
        <p className="mt-2 text-sm font-medium text-gray-900">
          Usuario: <span className="font-normal text-gray-600">{usuario}</span>
        </p>
        <p className="mt-2 text-sm font-medium text-gray-900">Nueva Contraseña temporal:</p>
        <div className="mt-1">
          <PasswordRevealBox password={contrasenaTemporal} />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
        <p>
          Por motivos de seguridad, la contraseña temporal expirará en 24 horas y deberá ser reemplazada al iniciar
          sesión.
        </p>
      </div>
    </SuccessModal>
  );
}