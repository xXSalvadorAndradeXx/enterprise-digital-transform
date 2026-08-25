"use client";

import { useState } from "react";

interface ContactData {
  fullName: string;
  email: string;
  dui: string;
  phone: string;
}

type ContactErrors = Partial<Record<keyof ContactData, string>>;

function validate(data: ContactData): ContactErrors {
  const errors: ContactErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Ingresa tu nombre completo";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "Ingresa un correo electrónico válido";
  if (data.dui.trim().length < 9) errors.dui = "Ingresa un número de identificación válido";
  if (!/^\d{8}$/.test(data.phone.trim()))
    errors.phone = "Ingresa un número de teléfono válido de 8 dígitos";
  return errors;
}

export default function CheckoutContact() {
  const [data, setData] = useState<ContactData>({
    fullName: "",
    email: "",
    dui: "",
    phone: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof ContactData, boolean>>>({});

  const errors = validate(data);
  const isFieldInvalid = (field: keyof ContactData) =>
    Boolean(touched[field]) && Boolean(errors[field]);

  const update = (field: keyof ContactData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const markTouched = (field: keyof ContactData) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <div className="flex flex-col gap-4">
        <TextField
          label="Nombre Completo"
          value={data.fullName}
          error={isFieldInvalid("fullName") ? errors.fullName : undefined}
          onChange={(v) => update("fullName", v)}
          onBlur={() => markTouched("fullName")}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={data.email}
          error={isFieldInvalid("email") ? errors.email : undefined}
          onChange={(v) => update("email", v)}
          onBlur={() => markTouched("email")}
        />
        <TextField
          label="Ingresa un número de identificación"
          value={data.dui}
          error={isFieldInvalid("dui") ? errors.dui : undefined}
          onChange={(v) => update("dui", v)}
          onBlur={() => markTouched("dui")}
        />
        <TextField
          label="Ingresa tu número de teléfono"
          required
          value={data.phone}
          error={isFieldInvalid("phone") ? errors.phone : undefined}
          onChange={(v) => update("phone", v)}
          onBlur={() => markTouched("phone")}
        />
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  type = "text",
  required,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  error?: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      
      <input
        type={type}
        value={value}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-required={required}
        className={`w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-100"
            : "border-gray-900 focus:border-[#1B21D1] focus:ring-[#1B21D1]/15"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
