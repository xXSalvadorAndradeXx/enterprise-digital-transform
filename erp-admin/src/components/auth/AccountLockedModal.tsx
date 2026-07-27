"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";

interface AccountLockedModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function AccountLockedModal({
  open,
  onAcknowledge,
}: AccountLockedModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onAcknowledge();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onAcknowledge]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onAcknowledge();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-locked-title"
        aria-describedby="account-locked-description"
        className="w-full max-w-[536px] rounded-2xl bg-white px-8 pb-8 pt-3 text-center shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-[90px] items-center justify-center"
        >
          <TriangleAlert
            className="h-[70px] w-[70px]  text-[#FF1717]"
            strokeWidth={2.5}
          />
        </div>

        <h2
          id="account-locked-title"
          className="mt-2 text-[22px] font-bold leading-tight text-[#FF3030]"
        >
          ¡Demasiados intentos fallidos!
        </h2>

        <p
          id="account-locked-description"
          className="mx-auto mt-4 max-w-[380px] text-[15px] font-semibold leading-5 text-[#111111]"
        >
          Tu cuenta ha sido bloqueada temporalmente por motivos de seguridad.
        </p>

        <button
          ref={buttonRef}
          type="button"
          onClick={onAcknowledge}
          className="mt-9 h-11 w-[180px] rounded-lg border border-[#1C21D1] bg-white text-[14px] font-bold text-[#1C21D1] transition-colors hover:bg-[#F2F5FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1] focus-visible:ring-offset-2"
        >
          Entendido
        </button>
      </section>
    </div>
  );
}