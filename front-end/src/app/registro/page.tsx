"use client";

import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type RegisterFormData = {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

const initialFormData: RegisterFormData = {
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const numberRegex = /\d/;
const uppercaseRegex = /[A-ZÁÉÍÓÚÑ]/;
const whitespaceRegex = /\s/;
const inputClassName =
  "w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const passwordInputClassName = `${inputClassName} pr-12`;
const primaryButtonClassName =
  "inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-300 disabled:hover:translate-y-0 disabled:hover:shadow-md";

function joinPasswordRequirements(requirements: string[]): string {
  if (requirements.length <= 1) {
    return requirements.join("");
  }

  return `${requirements.slice(0, -1).join(", ")} y ${
    requirements[requirements.length - 1]
  }`;
}

function validateRegisterForm(formData: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const nombre = formData.nombre.trim();
  const email = formData.email.trim();

  if (!nombre) {
    errors.nombre = "El nombre es obligatorio.";
  } else if (numberRegex.test(nombre)) {
    errors.nombre = "El nombre no debe contener números.";
  }

  if (!email) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!emailRegex.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!formData.password) {
    errors.password = "La contraseña es obligatoria.";
  } else {
    const passwordErrors: string[] = [];

    if (formData.password.length < 6) {
      passwordErrors.push("tener al menos 6 caracteres");
    }

    if (!uppercaseRegex.test(formData.password)) {
      passwordErrors.push("contener al menos una letra mayúscula");
    }

    if (!numberRegex.test(formData.password)) {
      passwordErrors.push("contener al menos un número");
    }

    if (whitespaceRegex.test(formData.password)) {
      passwordErrors.push("no contener espacios");
    }

    if (passwordErrors.length > 0) {
      errors.password = `La contraseña debe ${joinPasswordRequirements(
        passwordErrors,
      )}.`;
    }
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
    const fieldName = name as keyof RegisterFormData;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
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

    const registerEndpoint = "http://localhost:3000/auth/register";

    setIsSubmitting(true);

    try {
      const response = await fetch(registerEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      let responseData: unknown = null;

      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        setSubmitError(getBackendErrorMessage(responseData));
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
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_52%,#f9fafb_100%)] px-6 py-8 sm:py-10">
      {successMessage ? (
        <div
          role="status"
          className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-7 text-center shadow-[0_24px_80px_rgba(5,150,105,0.18)]"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-100">
            <CheckCircle2 className="h-11 w-11 text-emerald-600" aria-hidden="true" />
          </div>

          <h1 className="mt-7 text-2xl font-extrabold text-gray-950">
            {successMessage}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            ¡Tu cuenta fue creada con éxito!
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-lg border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(37,99,235,0.10)] sm:p-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-bold text-gray-950">Registro</h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Crea tu cuenta para continuar comprando en E-Commerce.
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre completo
            </label>
            <div className="relative mt-2">
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                value={formData.nombre}
                onChange={handleChange}
                className={inputClassName}
                aria-invalid={Boolean(errors.nombre)}
                aria-describedby={errors.nombre ? "nombre-error" : undefined}
              />
            </div>
            {errors.nombre ? (
              <p id="nombre-error" className="mt-2 text-sm text-red-600">
                {errors.nombre}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <div className="relative mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClassName}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
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
                className={passwordInputClassName}
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
                className={passwordInputClassName}
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

          {submitError ? (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClassName}
            >
              {isSubmitting ? "Registrando..." : "Crear cuenta"}
            </button>
          </div>

          <p className="border-t border-slate-100 pt-4 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
      )}
    </section>
  );
}
