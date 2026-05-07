"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

const initialFormData: RegisterFormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function validateRegisterForm(formData: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const email = formData.email.trim();

  if (!email) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!emailRegex.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!formData.password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (formData.password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "Confirma tu contraseña.";
  } else if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function getBackendErrorMessage(errorResponse: unknown): string {
  if (
    typeof errorResponse === "object" &&
    errorResponse !== null &&
    "message" in errorResponse
  ) {
    const message = (errorResponse as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "No se pudo completar el registro.";
}

export default function RegistroPage() {
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setSuccessMessage("");
    setSubmitError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateRegisterForm(formData);
    setErrors(validationErrors);
    setSuccessMessage("");
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        let errorResponse: unknown = null;

        try {
          errorResponse = await response.json();
        } catch {
          errorResponse = null;
        }

        setSubmitError(getBackendErrorMessage(errorResponse));
        return;
      }

      setFormData(initialFormData);
      setSuccessMessage("¡Registro completado correctamente!.");
    } catch {
      setSubmitError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900">Registro</h1>

        <p className="mt-3 text-sm text-gray-600">
          Crea tu cuenta para continuar comprando en E-Commerce.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="mt-2 text-sm text-red-600">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-gray-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p id="password-error" className="mt-2 text-sm text-red-600">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>
            <div className="relative mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? "confirm-password-error"
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((currentValue) => !currentValue)
                }
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-gray-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación de contraseña"
                    : "Mostrar confirmación de contraseña"
                }
              >
                {showConfirmPassword ? (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p
                id="confirm-password-error"
                className="mt-2 text-sm text-red-600"
              >
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          {successMessage ? (
            <p className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {successMessage}
            </p>
          ) : null}

          {submitError ? (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>
      </div>
    </section>
  );
}
