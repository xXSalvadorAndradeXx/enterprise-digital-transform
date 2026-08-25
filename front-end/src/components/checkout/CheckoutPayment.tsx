"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, CreditCard } from "lucide-react";

type PaymentMethod = "PAGADITO" | "PAY_AT_STORE" | "CARD";

export default function CheckoutPayment() {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");

  const selectMethod = (next: PaymentMethod) => {
    // "pagadito" queda maquetado/deshabilitado a propósito (contrato §9.3):
    // no se envía en el checkout ni requiere lógica de Backend.
    if (next === "PAGADITO") return;
    setMethod(next);
  };

  return (
    <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">Selecciona tu forma de pago</p>

        <MethodRow label="pagadito" disabled expanded={false} onClick={() => selectMethod("PAGADITO")} />

        <MethodRow
          label="pago en local"
          expanded={method === "PAY_AT_STORE"}
          onClick={() => selectMethod("PAY_AT_STORE")}
        />

        <MethodRow
          label="pago con tarjeta"
          expanded={method === "CARD"}
          onClick={() => selectMethod("CARD")}
        >
          <div className="mt-4 rounded-md border border-gray-200 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">Tarjeta de Crédito/Débito</p>
            <div className="flex flex-col gap-3">
              <TextInput
                label="Número de tarjeta"
                placeholder="1234 5678 9012 4521"
                value={cardNumber}
                onChange={setCardNumber}
                icon={<CreditCard className="h-4 w-4 text-gray-400" aria-hidden="true" />}
              />
              <TextInput
                label="Nombre en la tarjeta"
                placeholder="Nombre completo como aparece en la tarjeta"
                value={holderName}
                onChange={setHolderName}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Fecha de vencimiento"
                  placeholder="MM / AA"
                  value={expiration}
                  onChange={setExpiration}
                />
                <TextInput label="Código de seguridad" placeholder="123" value={cvv} onChange={setCvv} />
              </div>
            </div>
          </div>
        </MethodRow>
    </div>
  );
}

function MethodRow({
  label,
  disabled,
  expanded,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  expanded: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-md border ${expanded ? "border-[]" : "border-gray-900"}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={expanded}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
          disabled ? "cursor-not-allowed text-gray-400" : "text-gray-700"
        }`}
      >
        {label}
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[#1B21D1]" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  icon,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  icon?: React.ReactNode;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-900">{label}</label>
      <div className="relative">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-md border border-gray-900 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#1B21D1] focus:outline-none focus:ring-2 focus:ring-[#1B21D1]/15 ${
            icon ? "pr-10" : ""
          }`}
        />
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</span>}
      </div>
    </div>
  );
}
