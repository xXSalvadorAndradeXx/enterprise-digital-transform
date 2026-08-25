"use client";

import { ApiRequestError } from "@/lib/api-client";
import { hasActiveSession, saveAuthSession } from "@/lib/auth-session";
import { loginUser } from "@/services/auth/auth.service";
import type { LoginRequest } from "@/types/auth/auth.types";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Headphones,
  LockKeyhole,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type LoginFormErrors = Partial<
  Record<keyof Pick<LoginRequest, "email" | "password">, string>
>;

const initialFormData: LoginRequest = {
  email: "",
  password: "",
  rememberMe: false,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const inputClassName =
  "h-[38px] w-full rounded-md border border-transparent bg-[#f7f7f8] px-5 pr-12 text-xs text-[#3f3f46] outline-none transition placeholder:text-[#8a8a8f] focus:border-[#2829dd] focus:bg-white focus:ring-2 focus:ring-[#2829dd]/10";
const primaryButtonClassName =
  "mx-auto flex h-[34px] w-[238px] max-w-full items-center justify-center rounded-[2px] bg-[#2829dd] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2022c7] disabled:cursor-not-allowed disabled:bg-[#7f81e9]";

const loginBenefits = [
  [Truck, "Envíos gratis en compras +$50"],
  [RefreshCcw, "Devoluciones hasta 30 días"],
  [ShieldCheck, "Pago 100% seguro"],
  [Headphones, "Atención personal"],
] as const;

function validateLoginForm(formData: LoginRequest): LoginFormErrors {
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

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>(initialFormData);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (hasActiveSession()) {
      router.replace("/cuenta");
    }
  }, [router]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked, name, value } = event.target;

    if (name === "rememberMe") {
      setFormData((currentFormData) => ({
        ...currentFormData,
        rememberMe: checked,
      }));
    } else {
      const fieldName = name as keyof Pick<
        LoginRequest,
        "email" | "password"
      >;

      setFormData((currentFormData) => ({
        ...currentFormData,
        [fieldName]: value,
      }));

      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: undefined,
      }));
    }

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

    setIsSubmitting(true);

    try {
      const responseData = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      saveAuthSession(responseData);
      setFormData(initialFormData);
      setSuccessMessage("Inicio de sesión exitoso. Preparando tu cuenta...");
      router.push("/cuenta");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setSubmitError(
          error.message.toLowerCase().includes("credenciales inválidas")
            ? "Credenciales inválidas o usuario no encontrado."
            : error.message,
        );
        return;
      }

      setSubmitError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white">
        <div className="bg-[#f2f5fb]">
          <ul className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-3 gap-y-3 px-4 py-3 sm:grid-cols-4 sm:gap-y-0 sm:px-6 lg:px-8">
            {loginBenefits.map(([Icon, label]) => (
              <li
                key={label}
                className="flex min-w-0 items-center justify-center gap-2 text-center text-[10px] font-semibold text-[#111111] lg:gap-3 lg:text-xs"
              >
                <Icon
                  className="h-4 w-4 shrink-0 lg:h-[18px] lg:w-[18px]"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto grid w-full max-w-[1120px] flex-1 grid-cols-1 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)] md:gap-12 lg:gap-20">
          <div className="flex justify-center py-12 md:translate-x-4 md:items-start md:py-0 md:pt-[102px]">
            <div className="w-full max-w-[354px]">
              <h1 className="text-center text-[32px] leading-[1.08] font-bold text-[#404040] sm:text-[34px]">
                ¡Bienvenido de
                <br />
                nuevo!
              </h1>

              <form className="mt-[18px]" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    <Mail
                      className="pointer-events-none absolute top-1/2 right-4 h-[18px] w-[18px] -translate-y-1/2 text-[#5f636b]"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  {errors.email ? (
                    <p id="email-error" className="mt-1.5 px-1 text-xs text-red-600">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4">
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-[#5f636b] transition hover:text-[#2829dd]"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                    >
                      <LockKeyhole
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {errors.password ? (
                    <p
                      id="password-error"
                      className="mt-1.5 px-1 text-xs text-red-600"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div className="mx-auto mt-3 flex w-[78%] items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-3 w-3 shrink-0 rounded-[2px] border-slate-300 accent-[#2829dd]"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="whitespace-nowrap text-[10px] font-medium text-[#303030]"
                    >
                      Recordarme
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed whitespace-nowrap text-[10px] font-normal text-[#2829dd] disabled:opacity-100"
                  >
                    ¿Olvidaste la contraseña?
                  </button>
                </div>

                {submitError ? (
                  <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {submitError}
                  </p>
                ) : null}

                {successMessage ? (
                  <p className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {successMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${primaryButtonClassName} mt-5`}
                >
                  {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>

                <p
                  className="mt-7 text-center text-xs font-normal text-[#929292]"
                  aria-hidden="true"
                >
                  - o -
                </p>

                <p className="mt-5 text-center text-xs text-[#8b8b8b]">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/registro"
                    className="font-semibold text-[#111111] underline-offset-4 transition hover:text-[#2829dd] hover:underline"
                  >
                    Regístrate
                  </Link>
                </p>

                <button
                  type="button"
                  disabled
                  aria-label="Continuar con Google"
                  className="mx-auto mt-5 flex h-7 w-9 cursor-not-allowed items-center justify-center disabled:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.58A10 10 0 0 0 12 22Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.39 13.91A6.01 6.01 0 0 1 6.08 12c0-.66.11-1.3.31-1.91V7.51H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.49l3.34-2.58Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.51l3.34 2.58C7.18 7.72 9.39 5.96 12 5.96Z"
                    />
                  </svg>
                  <span className="sr-only">Continuar con Google</span>
                </button>
              </form>
            </div>
          </div>

          <div className="hidden h-full items-end justify-end pt-11 md:flex md:pr-2">
            <div className="relative h-full min-h-[36rem] w-full max-w-[334px] overflow-hidden rounded-t-full bg-[#f0f3fc]">
              <div className="absolute inset-x-[4%] bottom-0 h-[54%]">
                <Image
                  src="/images/auth/login-illustration.png"
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 308px, 0px"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
