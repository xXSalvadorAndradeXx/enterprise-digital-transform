"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  CreditCard,
} from "lucide-react";

export type PaymentMethod =
  | "PAGADITO"
  | "PAY_AT_STORE"
  | "CARD";

export interface PaymentData {
  method: PaymentMethod;
  card?: {
    number: string;
    holderName: string;
    expiration: string;
    cvv: string;
    brand: "VISA" | "MASTERCARD" | null;
  };
}

interface CheckoutPaymentProps {
  onContinue?: (payment: PaymentData) => void;
}

export default function CheckoutPayment({
  onContinue,
}: CheckoutPaymentProps) {
  const [method, setMethod] =
    useState<PaymentMethod | null>(null);

  const [cardNumber, setCardNumber] =
    useState("");

  const [holderName, setHolderName] =
    useState("");

  const [expiration, setExpiration] =
    useState("");

  const [cvv, setCvv] =
    useState("");

  const selectMethod = (
    next: PaymentMethod,
  ) => {
    // Pagadito queda visualmente deshabilitado.
    if (next === "PAGADITO") return;

    setMethod(next);
  };

  /*
   * Formatea el número de tarjeta:
   * 4111111111111111
   * ↓
   * 4111 1111 1111 1111
   */
  const handleCardNumberChange = (
    value: string,
  ) => {
    const numbersOnly = value
      .replace(/\D/g, "")
      .slice(0, 16);

    const formatted = numbersOnly.replace(
      /(.{4})/g,
      "$1 ",
    ).trim();

    setCardNumber(formatted);
  };

  /*
   * Detecta la franquicia según el primer dígito:
   * 4 = VISA
   * 5 = MASTERCARD
   */
  const getCardBrand = (
    value: string,
  ): "VISA" | "MASTERCARD" | null => {
    const firstDigit =
      value.replace(/\D/g, "")[0];

    if (firstDigit === "4") {
      return "VISA";
    }

    if (firstDigit === "5") {
      return "MASTERCARD";
    }

    return null;
  };

  const cardBrand =
    getCardBrand(cardNumber);

  /*
   * Formatea automáticamente el vencimiento:
   * 1230
   * ↓
   * 12/30
   */
  const handleExpirationChange = (
    value: string,
  ) => {
    const numbersOnly = value
      .replace(/\D/g, "")
      .slice(0, 4);

    let formatted = numbersOnly;

    if (numbersOnly.length > 2) {
      formatted =
        numbersOnly.slice(0, 2) +
        "/" +
        numbersOnly.slice(2);
    }

    setExpiration(formatted);
  };

  const handleContinue = () => {
    if (!onContinue || !method) return;

    const paymentData: PaymentData = {
      method,
    };

    if (method === "CARD") {
      paymentData.card = {
        number: cardNumber.replace(/\s/g, ""),
        holderName,
        expiration,
        cvv,
        brand: cardBrand,
      };
    }

    onContinue(paymentData);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">
        Selecciona tu forma de pago
      </p>

      <MethodRow
        label="pagadito"
        disabled
        expanded={false}
        onClick={() =>
          selectMethod("PAGADITO")
        }
      />

      <MethodRow
        label="pago en local"
        expanded={
          method === "PAY_AT_STORE"
        }
        onClick={() =>
          selectMethod("PAY_AT_STORE")
        }
      />

      <MethodRow
        label="pago con tarjeta"
        expanded={method === "CARD"}
        onClick={() =>
          selectMethod("CARD")
        }
      >
        <div className="mt-4 rounded-md border border-gray-200 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">
            Tarjeta de Crédito/Débito
          </p>

          <div className="flex flex-col gap-3">
            <TextInput
              label="Número de tarjeta"
              placeholder="1234 5678 9012 4521"
              value={cardNumber}
              onChange={
                handleCardNumberChange
              }
              icon={
                <div className="flex items-center gap-2">
                  {cardBrand && (
                    <span className="text-xs font-semibold text-gray-600">
                      {cardBrand}
                    </span>
                  )}

                  <CreditCard
                    className="h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              }
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
                onChange={
                  handleExpirationChange
                }
                maxLength={5}
              />

              <TextInput
                label="Código de seguridad"
                placeholder="123"
                value={cvv}
                onChange={(value) =>
                  setCvv(
                    value
                      .replace(/\D/g, "")
                      .slice(0, 4),
                  )
                }
                maxLength={4}
              />
            </div>
          </div>
        </div>
      </MethodRow>

      {method && (
        <button
          type="button"
          onClick={handleContinue}
          className="mt-2 w-full rounded-md bg-[#1B21D1] py-3 text-sm font-medium text-white transition hover:bg-[#1519A3]"
        >
          Finalizar compra
        </button>
      )}
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
    <div
      className={`rounded-md border ${
        expanded
          ? "border-[#1B21D1]"
          : "border-gray-900"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={expanded}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
          disabled
            ? "cursor-not-allowed text-gray-400"
            : "text-gray-700"
        }`}
      >
        {label}

        {expanded ? (
          <ChevronDown
            className="h-4 w-4 text-[#1B21D1]"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className="h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  icon,
  maxLength,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  icon?: React.ReactNode;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-900">
        {label}
      </label>

      <div className="relative">
        <input
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`w-full rounded-md border border-gray-900 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#1B21D1] focus:outline-none focus:ring-2 focus:ring-[#1B21D1]/15 ${
            icon ? "pr-20" : ""
          }`}
        />

        {icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}