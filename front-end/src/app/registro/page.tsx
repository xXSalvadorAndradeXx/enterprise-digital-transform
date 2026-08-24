"use client";

import type {
  RegisterCredentialsStep,
  RegisterPersonalStep,
} from "@/types/auth/auth.types";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const registrationSteps = [
  {
    title: "Información personal",
    description:
      "Comparte la información necesaria para identificar tu cuenta.",
  },
  {
    title: "Credenciales",
    description:
      "Configura los datos que utilizarás para acceder a tu cuenta.",
  },
  {
    title: "Dirección",
    description:
      "Indica la ubicación que se asociará a tus futuras entregas.",
  },
  {
    title: "Confirmación",
    description:
      "Revisa que la información de los pasos anteriores esté completa.",
  },
] as const;

const navigationButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:shadow-none sm:w-auto";
const inputClassName =
  "w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function RegistroPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [personalStep, setPersonalStep] = useState<RegisterPersonalStep>({
    fullName: "",
    dui: "",
    phone: "",
  });
  const [credentialsStep, setCredentialsStep] =
    useState<RegisterCredentialsStep>({
      email: "",
      password: "",
    });
  const [showPassword, setShowPassword] = useState(false);
  const activeStepTitleRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(activeStep);
  const lastStepIndex = registrationSteps.length - 1;
  const currentStep = registrationSteps[activeStep];

  useEffect(() => {
    if (previousStepRef.current === activeStep) {
      return;
    }

    previousStepRef.current = activeStep;
    activeStepTitleRef.current?.focus();
  }, [activeStep]);

  const goToPreviousStep = () => {
    setActiveStep((currentStepIndex) =>
      Math.max(currentStepIndex - 1, 0),
    );
  };

  const goToNextStep = () => {
    setActiveStep((currentStepIndex) =>
      Math.min(currentStepIndex + 1, lastStepIndex),
    );
  };

  const updatePersonalField = (
    field: keyof RegisterPersonalStep,
    value: string,
  ) => {
    setPersonalStep((currentStepData) => ({
      ...currentStepData,
      [field]: value,
    }));
  };

  const updateCredentialsField = (
    field: keyof RegisterCredentialsStep,
    value: string,
  ) => {
    setCredentialsStep((currentStepData) => ({
      ...currentStepData,
      [field]: value,
    }));
  };

  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_52%,#f9fafb_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(37,99,235,0.10)] sm:p-6">
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-bold text-gray-950">Registro</h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Completa los cuatro pasos para crear tu cuenta.
          </p>
        </div>

        <nav className="mt-6" aria-label="Progreso del registro">
          <ol className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {registrationSteps.map((step, stepIndex) => {
              const isActive = stepIndex === activeStep;
              const isCompleted = stepIndex < activeStep;
              const stepState = isActive
                ? "Activo"
                : isCompleted
                  ? "Completado"
                  : "Pendiente";

              return (
                <li
                  key={step.title}
                  aria-current={isActive ? "step" : undefined}
                  className={`min-w-0 rounded-xl border p-3 transition-colors ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : isCompleted
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:flex-col sm:text-center">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-300 bg-white text-slate-500"
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        stepIndex + 1
                      )}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`block break-words text-xs font-semibold leading-5 sm:text-sm ${
                          isActive
                            ? "text-blue-800"
                            : isCompleted
                              ? "text-emerald-800"
                              : "text-slate-600"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="sr-only">: {stepState}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <div
          className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center sm:px-8"
          aria-labelledby="active-registration-step"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Paso {activeStep + 1} de {registrationSteps.length}
          </span>
          <h2
            ref={activeStepTitleRef}
            id="active-registration-step"
            tabIndex={-1}
            className="mt-3 text-xl font-bold text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
          >
            {currentStep.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
            {currentStep.description}
          </p>

          {activeStep === 0 ? (
            <div className="mt-6 grid w-full min-w-0 max-w-2xl gap-4 text-left sm:grid-cols-2">
              <div className="min-w-0 sm:col-span-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={personalStep.fullName}
                  onChange={(event) =>
                    updatePersonalField("fullName", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="dui"
                  className="block text-sm font-medium text-gray-700"
                >
                  DUI
                </label>
                <input
                  id="dui"
                  name="dui"
                  type="text"
                  value={personalStep.dui}
                  onChange={(event) =>
                    updatePersonalField("dui", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={personalStep.phone}
                  onChange={(event) =>
                    updatePersonalField("phone", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="mt-6 grid w-full min-w-0 max-w-xl gap-4 text-left">
              <div className="min-w-0">
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
                  value={credentialsStep.email}
                  onChange={(event) =>
                    updateCredentialsField("email", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div className="min-w-0">
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
                    value={credentialsStep.password}
                    onChange={(event) =>
                      updateCredentialsField("password", event.target.value)
                    }
                    className={`${inputClassName} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((currentValue) => !currentValue)
                    }
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-gray-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={activeStep === 0}
            className={`${navigationButtonClassName} border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <button
            type="button"
            onClick={goToNextStep}
            disabled={activeStep === lastStepIndex}
            className={`${navigationButtonClassName} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white`}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
