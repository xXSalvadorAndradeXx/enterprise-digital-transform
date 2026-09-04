"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { getFirstAllowedRoute } from "@/constants/route-permissions";

interface SuccessAlertProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export default function SuccessAlert({
  open,
  onClose,
  title = "¡Contraseña actualizada!",
  message = "Se guardó su contraseña correctamente.",
  buttonText = "Aceptar",
}: SuccessAlertProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isRedirecting, setIsRedirecting] =
    useState(false);

  const router = useRouter();
  const { recoverSession } = useAuth();

  /**
   * Elimina la sesión temporal y redirige al login.
   */
  const handleAccept = useCallback(async (): Promise<void> => {
    // Evita varios clics mientras se procesa.
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);

    try {
      const session = await recoverSession();

      onClose();

      if (!session) {
        router.replace("/login");
        router.refresh();
        return;
      }

      const destination = getFirstAllowedRoute(session.user.permissions) ?? "/dashboard";

      router.replace(destination);

      // Actualiza los Server Components.
      router.refresh();
    } finally {
      setIsRedirecting(false);
    }
  }, [
    isRedirecting,
    onClose,
    recoverSession,
    router,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    buttonRef.current?.focus();

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        void handleAccept();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [handleAccept, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-3">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-message"
        className="relative h-[320px] w-full max-w-[600px] overflow-hidden rounded-2xl bg-white shadow-[0_1px_6.2px_5px_rgba(0,0,0,0.25)]"
      >
        <div
          className="absolute left-1/2 top-6 flex size-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-[#55B559]"
          aria-hidden="true"
        >
          <Check
            className="size-9 text-white"
            strokeWidth={3}
          />
        </div>

        <h2
          id="success-title"
          className="absolute left-1/2 top-[100px] w-[calc(100%-2rem)] -translate-x-1/2 text-center text-2xl font-bold text-[#55B559]"
        >
          {title}
        </h2>

        <p
          id="success-message"
          className="absolute left-1/2 top-[148px] w-[calc(100%-2rem)] max-w-[496px] -translate-x-1/2 text-center text-xl font-medium leading-6 text-[#4A4A4A] sm:text-2xl"
        >
          {message}
        </p>

        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            void handleAccept();
          }}
          disabled={isRedirecting}
          className="absolute left-1/2 top-[216px] flex h-12 w-[200px] -translate-x-1/2 items-center justify-center gap-2 rounded-lg bg-[#55B559] text-2xl font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-green-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRedirecting && (
            <LoaderCircle
              className="size-5 animate-spin"
              aria-hidden="true"
            />
          )}

          {isRedirecting
            ? "Redirigiendo..."
            : buttonText}
        </button>
      </section>
    </div>
  );
}
