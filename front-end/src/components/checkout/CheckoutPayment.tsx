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

  const [errors, setErrors] = useState<{
    cardNumber?: string;
    holderName?: string;
    expiration?: string;
    cvv?: string;
  }>({});

  const selectMethod = (
    next: PaymentMethod,
  ) => {
    if (next === "PAGADITO") return;

    setMethod(next);
    setErrors({});
  };

  const handleCardNumberChange = (
    value: string,
  ) => {
    const numbersOnly = value
      .replace(/\D/g, "")
      .slice(0, 16);

    const formatted = numbersOnly
      .replace(/(.{4})/g, "$1 ")
      .trim();

    setCardNumber(formatted);

    if (errors.cardNumber) {
      setErrors((previous) => ({
        ...previous,
        cardNumber: undefined,
      }));
    }
  };

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

    if (errors.expiration) {
      setErrors((previous) => ({
        ...previous,
        expiration: undefined,
      }));
    }
  };


  const isValidExpiration = (value: string): boolean => {
  const match = value.match(/^(\d{2})\/(\d{2})$/);

  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (month < 1 || month > 12) {
    return false;
  }

  const currentDate = new Date();

  const currentYear =
    currentDate.getFullYear() % 100;

  const currentMonth =
    currentDate.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (
    year === currentYear &&
    month < currentMonth
  ) {
    return false;
  }

  return true;
};

  const handleContinue = () => {
    if (!method || !onContinue) return;

    /*
     * Pago en local:
     * no necesita datos de tarjeta.
     */
    if (method === "PAY_AT_STORE") {
      onContinue({
        method: "PAY_AT_STORE",
      });

      return;
    }

    /*
     * Validación simulada de tarjeta.
     * No existe lógica bancaria real.
     */
    const newErrors: {
      cardNumber?: string;
      holderName?: string;
      expiration?: string;
      cvv?: string;
    } = {};

    if (!cardNumber.trim()) {
      newErrors.cardNumber =
        "Ingresa el número de tarjeta";
    }

    if (!holderName.trim()) {
      newErrors.holderName =
        "Ingresa el nombre de la tarjeta";
    }

    if (!expiration.trim()) {
  newErrors.expiration =
    "Ingresa la fecha de vencimiento";
} else if (!isValidExpiration(expiration)) {
  newErrors.expiration =
    "Ingresa una fecha de vencimiento válida";
}

    if (!cvv.trim()) {
      newErrors.cvv =
        "Ingresa el código de seguridad";
    }

    setErrors(newErrors);

    /*
     * Si falta algún campo,
     * no avanzamos.
     */
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const paymentData: PaymentData = {
      method: "CARD",
      card: {
        number: cardNumber.replace(/\s/g, ""),
        holderName,
        expiration,
        cvv,
        brand: cardBrand,
      },
    };

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
              error={errors.cardNumber}
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
              error={errors.holderName}
              onChange={(value) => {
                setHolderName(value);

                if (errors.holderName) {
                  setErrors((previous) => ({
                    ...previous,
                    holderName: undefined,
                  }));
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Fecha de vencimiento"
                placeholder="MM / AA"
                value={expiration}
                error={errors.expiration}
                maxLength={5}
                onChange={
                  handleExpirationChange
                }
              />

              <TextInput
                label="Código de seguridad"
                placeholder="123"
                value={cvv}
                error={errors.cvv}
                maxLength={4}
                onChange={(value) => {
                  setCvv(
                    value
                      .replace(/\D/g, "")
                      .slice(0, 4),
                  );

                  if (errors.cvv) {
                    setErrors((previous) => ({
                      ...previous,
                      cvv: undefined,
                    }));
                  }
                }}
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
  error,
  icon,
  maxLength,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
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
          aria-invalid={Boolean(error)}
          className={`w-full rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
            icon ? "pr-20" : ""
          } ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-900 focus:border-[#1B21D1] focus:ring-[#1B21D1]/15"
          }`}
        />

        {icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}