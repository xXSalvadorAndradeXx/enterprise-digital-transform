"use client";

import { useState } from "react";
import { Check, Clock, Copy } from "lucide-react";
import { PasswordRevealBoxProps } from "./Passwordrevealbox.types";

export function PasswordRevealBox({ password, expiresInHours = 24 }: PasswordRevealBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    alert("No fue posible copiar la contraseña.");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <code className="select-all font-mono text-base font-semibold tracking-wide text-gray-900">
          {password}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={14} />
              Copiar
            </>
          )}
        </button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
        <Clock size={14} />
        Esta contraseña expira en {expiresInHours} horas.
      </p>
    </div>
  );
}