"use client";

import { AuthBenefitsBar } from "@/components/auth/AuthBenefitsBar";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { normalizeAuthError } from "@/lib/auth-error";
import { saveAuthSession } from "@/lib/auth-session";
import {
  registrationPasswordRequirements,
  registerFormSchema,
} from "@/lib/validations/auth.schemas";
import { registerUser } from "@/services/auth/auth.service";
import { locationsService } from "@/services/locations/locations.service";
import type { RegisterFormValues, RegisterRequest } from "@/types/auth/auth.types";
import type { Department, District } from "@/types/locations/location.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

const steps = ["Información personal", "Credenciales", "Dirección"] as const;
const stepFields: Array<Array<keyof RegisterFormValues>> = [
  ["fullName", "dui", "phone"],
  ["email", "password"],
  ["departmentId", "districtId", "city", "addressLine"],
];

const initialValues: RegisterFormValues = {
  fullName: "",
  dui: "",
  phone: "",
  email: "",
  password: "",
  departmentId: null,
  districtId: null,
  city: "",
  addressLine: "",
};

const inputClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-[#f7f7f8] px-4 text-sm text-[#333] outline-none transition placeholder:text-[#8d8d93] focus:border-[#2528dc] focus:bg-white focus:ring-4 focus:ring-[#2528dc]/10 aria-invalid:border-red-500";
const buttonClass =
  "inline-flex h-11 min-w-28 items-center justify-center rounded-md px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2528dc]/20 disabled:cursor-not-allowed disabled:opacity-60";

function formatDui(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits.length > 8 ? `${digits.slice(0, 8)}-${digits.slice(8)}` : digits;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p> : null;
}

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const departmentId = useWatch({ control, name: "departmentId" });
  const password = useWatch({ control, name: "password" }) ?? "";

  useEffect(() => {
    const controller = new AbortController();
    setCatalogError("");
    locationsService
      .getDepartments(controller.signal)
      .then((items) => {
        setDepartments(items);
        setCatalogError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogError("No pudimos cargar los departamentos.");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setDistricts([]);
    setValue("districtId", null);
    if (!departmentId) return;

    const controller = new AbortController();
    setCatalogError("");
    locationsService
      .getDistricts(departmentId, controller.signal)
      .then((items) => {
        setDistricts(items);
        setCatalogError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogError("No pudimos cargar los distritos.");
        }
      });
    return () => controller.abort();
  }, [departmentId, setValue]);

  const advance = async () => {
    const valid = await trigger(stepFields[step], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, 2));
  };

  const submitRegistration = async (values: RegisterFormValues) => {
    if (step < 2) {
      await advance();
      return;
    }

    setSubmitError("");
    const request: RegisterRequest = {
      ...values,
      departmentId: values.departmentId as number,
      districtId: values.districtId as number,
      phone: values.phone.replace(/\D/g, "").slice(-8),
    };

    try {
      const response = await registerUser(request);
      saveAuthSession(response.data);
      router.push("/cuenta");
    } catch (error) {
      const normalized = normalizeAuthError(error);
      normalized.fields.forEach((field) =>
        setError(field, { type: "server", message: normalized.message }),
      );
      setSubmitError(normalized.message);
    }
  };

  return (
    <section className="flex min-h-screen flex-col bg-white">
      <AuthBenefitsBar />

      <nav
        className="mx-auto w-full max-w-4xl px-5 pt-9 sm:px-8 sm:pt-12"
        aria-label="Progreso del registro"
      >
        <ol className="grid grid-cols-3 gap-3 sm:gap-10">
          {steps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => index <= step && setStep(index)}
                disabled={index > step}
                className={`flex w-full items-center justify-center gap-2 border-b-2 px-1 pb-4 text-xs font-semibold transition sm:gap-3 sm:text-sm ${
                  index === step
                    ? "border-[#2528dc] text-[#2528dc]"
                    : "border-transparent text-slate-400"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white ${index === step ? "bg-[#2528dc]" : "bg-slate-400"}`}>
                  {index + 1}
                </span>
                <span className="hidden sm:block">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_360px] md:gap-16 lg:gap-24">
        <main className="mx-auto w-full max-w-xl py-9 md:py-11">

          <form
            onSubmit={(event) => {
              if (step < 2) {
                event.preventDefault();
                void advance();
                return;
              }

              void handleSubmit(submitRegistration)(event);
            }}
            noValidate
          >
            <h1 className="text-3xl font-bold text-[#3f3f3f] sm:text-4xl">
              {step === 0 ? "Crea una cuenta" : step === 1 ? "Credenciales" : "Dirección"}
            </h1>

            {step === 0 && (
              <div className="mt-7 space-y-4">
                <input {...register("fullName")} className={inputClass} placeholder="Nombre completo" autoComplete="name" />
                <ErrorText message={errors.fullName?.message} />
                <Controller
                  name="dui"
                  control={control}
                  render={({ field }) => (
                    <input {...field} onChange={(event) => field.onChange(formatDui(event.target.value))} className={inputClass} placeholder="DUI (12345678-9)" inputMode="numeric" maxLength={10} />
                  )}
                />
                <ErrorText message={errors.dui?.message} />
                <input {...register("phone")} className={inputClass} placeholder="Teléfono (8 dígitos)" inputMode="tel" autoComplete="tel" maxLength={12} />
                <ErrorText message={errors.phone?.message} />
              </div>
            )}

            {step === 1 && (
              <div className="mt-7 space-y-4">
                <div className="relative">
                  <input {...register("email")} className={`${inputClass} pr-12`} placeholder="Correo electrónico" type="email" autoComplete="email" />
                  <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                </div>
                <ErrorText message={errors.email?.message} />
                <div className="relative">
                  <input {...register("password")} className={`${inputClass} pr-12`} placeholder="Contraseña" type={showPassword ? "text" : "password"} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-slate-500 hover:text-[#2528dc]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                <ErrorText message={errors.password?.message} />
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold text-[#4a4a4a]">La contraseña debe contener:</p>
                  <ul className="mt-2 space-y-1">
                    {registrationPasswordRequirements.map((requirement) => (
                      <li key={requirement.id} className={`flex items-center gap-2 text-xs ${requirement.isMet(password) ? "text-emerald-700" : "text-slate-500"}`}>
                        <CheckCircle2 className="h-4 w-4" /> {requirement.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-7 space-y-4">
                <Controller name="departmentId" control={control} render={({ field }) => (
                  <select {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)} className={inputClass}>
                    <option value="">Selecciona un departamento</option>
                    {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                )} />
                <ErrorText message={errors.departmentId?.message} />
                <Controller name="districtId" control={control} render={({ field }) => (
                  <select {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)} className={inputClass} disabled={!departmentId}>
                    <option value="">Selecciona un distrito</option>
                    {districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                )} />
                <ErrorText message={errors.districtId?.message} />
                <input {...register("city")} className={inputClass} placeholder="Ciudad" autoComplete="address-level2" />
                <ErrorText message={errors.city?.message} />
                <input {...register("addressLine")} className={inputClass} placeholder="Dirección completa" autoComplete="street-address" />
                <ErrorText message={errors.addressLine?.message} />
                {catalogError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{catalogError}</p>}
              </div>
            )}

            {submitError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{submitError}</p>}

            <div className="mt-8 flex justify-end gap-3">
              {step > 0 && (
                <button type="button" onClick={() => setStep((current) => current - 1)} className={`${buttonClass} border border-[#2528dc] bg-white text-[#2528dc] hover:bg-indigo-50`}>
                  Anterior
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className={`${buttonClass} bg-[#2528dc] text-white shadow-md shadow-indigo-200 hover:bg-[#181bc2]`}>
                {isSubmitting ? "Creando cuenta..." : step < 2 ? "Siguiente" : "Crear cuenta"}
              </button>
            </div>
          </form>
        </main>

        <aside className="hidden items-start pt-8 md:flex">
          <AuthIllustrationPanel variant="registro" />
        </aside>
      </div>
    </section>
  );
}
