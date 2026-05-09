"use client";

import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;

const initialFormData: LoginFormData = {
  email: "",
  password: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const inputClassName =
  "w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const passwordInputClassName = `${inputClassName} pr-12`;
const primaryButtonClassName =
  "inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-300 disabled:hover:translate-y-0 disabled:hover:shadow-md";

function validateLoginForm(formData: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};
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
      if (message.toLowerCase().includes("credenciales inválidas")) {
        return "Credenciales inválidas o usuario no encontrado.";
      }

      return message;
    }
  }

  return "Credenciales inválidas o usuario no encontrado.";
}

function saveSession(responseData: unknown) {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "access_token" in responseData
  ) {
    const accessToken = (responseData as { access_token?: unknown })
      .access_token;

    if (typeof accessToken === "string") {
      localStorage.setItem("access_token", accessToken);
    }
  }

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "user" in responseData
  ) {
    const user = (responseData as { user?: unknown }).user;

    if (typeof user === "object" && user !== null) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  window.dispatchEvent(new Event("auth-session-changed"));
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      router.replace("/cuenta");
    }
  }, [router]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof LoginFormData;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateLoginForm(formData);
    setErrors(validationErrors);
    setSubmitError("");
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const loginEndpoint = "http://localhost:3000/auth/login";

    setIsSubmitting(true);

    try {
      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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

      saveSession(responseData);
      setFormData(initialFormData);
      setSuccessMessage("Inicio de sesión exitoso. Preparando tu cuenta...");
      router.push("/cuenta");
    } catch {
      setSubmitError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_52%,#f9fafb_100%)] px-6 py-8 sm:py-10">
      <div className="w-full max-w-md rounded-lg border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(37,99,235,0.10)] sm:p-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-bold text-gray-950">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Ingresa con tu correo y contraseña para continuar.
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
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

          {submitError ? (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {successMessage}
            </p>
          ) : null}

          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClassName}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>

          <p className="border-t border-slate-100 pt-4 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
