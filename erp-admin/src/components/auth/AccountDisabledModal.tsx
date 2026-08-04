"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AccountDisabledModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDisabledModal({
  isOpen,
  onClose,
}: AccountDisabledModalProps) {
  const router = useRouter();

  const [isClosingSession, setIsClosingSession] =
    useState(false);

  const handleAccept = async (): Promise<void> => {
    if (isClosingSession) {
      return;
    }

    setIsClosingSession(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(
        "No fue posible cerrar la sesión:",
        error,
      );
    } finally {
      onClose();

      router.replace("/login");
      router.refresh();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <LockKeyhole
            size={30}
            strokeWidth={1.8}
            className="text-amber-500"
          />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-gray-900">
          Cuenta desactivada
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Tu cuenta ha sido desactivada por un
          administrador. Ya no puedes continuar
          utilizando el sistema. Si consideras que se
          trata de un error, comunícate con un
          administrador.
        </p>

        <button
          type="button"
          onClick={handleAccept}
          disabled={isClosingSession}
          className="mx-auto mt-6 flex h-10 w-32 items-center justify-center rounded-md bg-[#1C21D1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}