"use client";

import { useEffect, useState } from "react";

interface ContactData {
  fullName: string;
  email: string;
  dui: string;
  phone: string;
}

type ContactErrors = Partial<Record<keyof ContactData, string>>;

function validate(data: ContactData): ContactErrors {
  const errors: ContactErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Ingresa tu nombre completo";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.email.trim(),
    )
  ) {
    errors.email = "Ingresa un correo electrónico válido";
  }

  if (data.dui.trim().length < 9) {
    errors.dui =
      "Ingresa un número de identificación válido";
  }

  /*
   * El teléfono solamente muestra error cuando
   * el usuario ya comenzó a escribir.
   */
  if (
    data.phone.length > 0 &&
    !/^\d{8}$/.test(data.phone)
  ) {
    errors.phone =
      "Ingresa un número de teléfono válido de 8 dígitos";
  }

  return errors;
}

export default function CheckoutContact() {
  const [data, setData] = useState<ContactData>({
    fullName: "",
    email: "",
    dui: "",
    phone: "",
  });

  const [touched, setTouched] = useState<
    Partial<Record<keyof ContactData, boolean>>
  >({});

  const [loadingUser, setLoadingUser] = useState(true);

  const errors = validate(data);

  /*
   * Obtener información del usuario logueado.
   *
   * Mientras no exista Backend real, esta petición
   * será respondida por MSW.
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(
          "/api/v1/ecommerce/auth/me",
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          // Usuario invitado: formulario vacío.
          return;
        }

        const user = await response.json();

        setData({
          fullName: user.fullName ?? "",
          email: user.email ?? "",
          dui: user.dui ?? "",
          phone: user.phone ?? "",
        });
      } catch (error) {
        console.error(
          "No se pudo obtener el usuario actual:",
          error,
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const isFieldInvalid = (
    field: keyof ContactData,
  ) => {
    return (
      Boolean(touched[field]) &&
      Boolean(errors[field])
    );
  };

  const update = (
    field: keyof ContactData,
    value: string,
  ) => {
    /*
     * El teléfono solamente permite números
     * y máximo 8 dígitos.
     */
    if (field === "phone") {
      value = value
        .replace(/\D/g, "")
        .slice(0, 8);
    }

    setData((prev) => ({
      ...prev,
      [field]: value,
    }));

    /*
     * Al escribir teléfono hacemos que el error
     * aparezca inmediatamente.
     */
    if (field === "phone") {
      setTouched((prev) => ({
        ...prev,
        phone: true,
      }));
    }
  };

  const markTouched = (
    field: keyof ContactData,
  ) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[50px] animate-pulse rounded-md bg-gray-100" />
        <div className="h-[50px] animate-pulse rounded-md bg-gray-100" />
        <div className="h-[50px] animate-pulse rounded-md bg-gray-100" />
        <div className="h-[50px] animate-pulse rounded-md bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Nombre Completo"
        value={data.fullName}
        error={
          isFieldInvalid("fullName")
            ? errors.fullName
            : undefined
        }
        onChange={(value) =>
          update("fullName", value)
        }
        onBlur={() =>
          markTouched("fullName")
        }
      />

      <TextField
        label="Correo electrónico"
        type="email"
        value={data.email}
        error={
          isFieldInvalid("email")
            ? errors.email
            : undefined
        }
        onChange={(value) =>
          update("email", value)
        }
        onBlur={() =>
          markTouched("email")
        }
      />

      <TextField
        label="Ingresa un número de identificación"
        value={data.dui}
        error={
          isFieldInvalid("dui")
            ? errors.dui
            : undefined
        }
        onChange={(value) =>
          update("dui", value)
        }
        onBlur={() =>
          markTouched("dui")
        }
      />

      <TextField
        label="Ingresa tu número de teléfono"
        required
        value={data.phone}
        error={
          isFieldInvalid("phone")
            ? errors.phone
            : undefined
        }
        onChange={(value) =>
          update("phone", value)
        }
        onBlur={() =>
          markTouched("phone")
        }
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
        onChange={(e) =>
          onChange(e.target.value)
        }
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-required={required}
        className={`w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-100"
            : "border-gray-900 focus:border-[#1B21D1] focus:ring-[#1B21D1]/15"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}