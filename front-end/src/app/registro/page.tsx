"use client";

import { AuthBenefitsBar } from "@/components/auth/AuthBenefitsBar";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import type {
  RegisterAddressStep,
  RegisterCredentialsStep,
  RegisterPersonalStep,
} from "@/types/auth/auth.types";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const registrationSteps = [
  {
    id: "personal",
    progressLabel: "Información personal",
    title: "Crea una cuenta",
    contentClassName: "max-w-[330px]",
    positionClassName:
      "md:-translate-x-0.5 md:translate-y-[5px]",
    navigationClassName: "mt-7",
    previousButtonClassName: "w-[74px]",
    nextButtonClassName: "w-[74px]",
    previousLabel: null,
    nextLabel: "Siguiente",
  },
  {
    id: "credentials",
    progressLabel: "Credenciales",
    title: "Credenciales",
    contentClassName: "max-w-[280px]",
    positionClassName: "md:-translate-x-px md:-translate-y-5",
    navigationClassName: "mt-5",
    previousButtonClassName: "w-[74px]",
    nextButtonClassName: "w-[74px]",
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  },
  {
    id: "address",
    progressLabel: "Dirección",
    title: "Dirección",
    contentClassName: "max-w-[315px]",
    positionClassName: "md:translate-x-1 md:-translate-y-[5px]",
    navigationClassName: "mt-6",
    previousButtonClassName: "w-[74px]",
    nextButtonClassName: "w-[74px]",
    previousLabel: "Anterior",
    nextLabel: "Revisar datos",
  },
  {
    id: "confirmation",
    progressLabel: null,
    title: "Confirmación de datos",
    contentClassName: "max-w-[400px]",
    positionClassName: "md:translate-x-[7px]",
    navigationClassName: "mt-5 pr-5",
    previousButtonClassName: "w-[83px]",
    nextButtonClassName: "w-[96px]",
    previousLabel: "Modificar datos",
    nextLabel: "Confirmar y enviar",
  },
] as const;

const editableSteps = registrationSteps.slice(0, 3);
const passwordRequirements = [
  "Mínimo 8 caracteres",
  "Una letra mayúscula y una minúscula",
  "Un número o carácter especial (!@#$%^&*)",
] as const;

const inputClassName =
  "h-10 w-full rounded-lg border border-transparent bg-[#f7f7f8] px-5 text-sm text-[#4a4a4a] outline-none transition placeholder:text-[#929292] focus:border-[#1c21d1] focus:bg-white focus:ring-2 focus:ring-[#1c21d1]/10";
const navigationButtonClassName =
  "inline-flex h-[21px] items-center justify-center whitespace-nowrap rounded-[2px] border px-0 text-[9px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c21d1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100";

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
  const [addressStep, setAddressStep] = useState<RegisterAddressStep>({
    departmentId: "",
    districtId: "",
    city: "",
    addressLine: "",
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

  const updateAddressField = (
    field: keyof RegisterAddressStep,
    value: string,
  ) => {
    setAddressStep((currentStepData) => ({
      ...currentStepData,
      [field]: value,
    }));
  };

  const confirmationRows = [
    ["Nombre completo:", personalStep.fullName],
    ["Teléfono:", personalStep.phone],
    ["Email:", credentialsStep.email],
    ["Dirección:", addressStep.addressLine],
    ["Ciudad:", addressStep.city],
    ["Departamento:", addressStep.departmentId],
    ["Distrito", addressStep.districtId],
  ] as const;

  return (
    <section className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white">
      <AuthBenefitsBar />

      {activeStep < lastStepIndex ? (
        <nav
          className="mx-auto w-full max-w-[558px] px-4 pt-14 sm:px-0 sm:pt-16"
          aria-label="Progreso del registro"
        >
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(3,171px)] sm:justify-between sm:gap-0">
            {editableSteps.map((step, stepIndex) => {
              const isActive = stepIndex === activeStep;

              return (
                <li
                  key={step.id}
                  aria-current={isActive ? "step" : undefined}
                  className={`min-w-0 border-b-2 pb-4 ${
                    isActive ? "border-[#1c21d1]" : "border-transparent"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStep(stepIndex)}
                    className="flex w-full min-w-0 items-center justify-center gap-2 sm:justify-start sm:gap-3"
                    aria-label={`Ir al paso ${stepIndex + 1}: ${step.progressLabel}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive
                          ? "bg-[#1c21d1] text-white"
                          : "bg-[#b5b1b8] text-white"
                      }`}
                      aria-hidden="true"
                    >
                      {stepIndex + 1}
                    </span>
                    <span
                      className={`min-w-0 text-center text-[10px] font-semibold sm:whitespace-nowrap sm:text-xs ${
                        isActive ? "text-[#1c21d1]" : "text-[#aea9b1]"
                      }`}
                    >
                      {step.progressLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div
        className={`mx-auto grid w-full max-w-[1120px] flex-1 grid-cols-1 px-5 pb-0 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)] md:gap-12 lg:gap-20 ${
          activeStep < lastStepIndex ? "pt-10" : "pt-12 sm:pt-16"
        }`}
      >
        <main
          className="flex justify-center pb-12 md:translate-x-5 md:pb-0"
          aria-labelledby="active-registration-step"
        >
          <div
            className={`w-full ${currentStep.contentClassName} ${currentStep.positionClassName}`}
          >
            <h1
              ref={activeStepTitleRef}
              id="active-registration-step"
              tabIndex={-1}
              className="text-[34px] leading-[1.15] font-bold tracking-[0.02em] text-[#4a4a4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c21d1] focus-visible:ring-offset-4"
            >
              {currentStep.title}
            </h1>

            {activeStep === 0 ? (
              <div className="mt-6 space-y-[14px]">
                <div>
                  <label htmlFor="fullName" className="sr-only">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Nombre completo"
                    value={personalStep.fullName}
                    onChange={(event) =>
                      updatePersonalField("fullName", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="dui" className="sr-only">
                    Documento Único de Identidad (DUI)
                  </label>
                  <input
                    id="dui"
                    name="dui"
                    type="text"
                    placeholder="Documento Único de Identidad (DUI)"
                    value={personalStep.dui}
                    onChange={(event) =>
                      updatePersonalField("dui", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="sr-only">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Teléfono"
                    value={personalStep.phone}
                    onChange={(event) =>
                      updatePersonalField("phone", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="mt-[27px]">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Correo
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Correo"
                      value={credentialsStep.email}
                      onChange={(event) =>
                        updateCredentialsField("email", event.target.value)
                      }
                      className={`${inputClassName} pr-11`}
                    />
                    <Mail
                      className="pointer-events-none absolute top-1/2 right-4 h-[18px] w-[18px] -translate-y-1/2 text-[#93969d]"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="mt-[14px]">
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Contraseña"
                      value={credentialsStep.password}
                      onChange={(event) =>
                        updateCredentialsField("password", event.target.value)
                      }
                      className={`${inputClassName} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#93969d] transition hover:text-[#1c21d1]"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <Eye
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.7}
                          aria-hidden="true"
                        />
                      ) : (
                        <EyeOff
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.7}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-px px-0.5 text-[#929292]">
                  <p className="text-[11px] font-semibold text-[#363636]">
                    La contraseña debe contener:
                  </p>
                  <ul className="mt-0.5">
                    {passwordRequirements.map((requirement) => (
                      <li
                        key={requirement}
                        className="flex items-center gap-2 text-[10px] leading-[14px]"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="mt-[5px] space-y-[10px]">
                <div>
                  <label htmlFor="departmentId" className="sr-only">
                    Departamento
                  </label>
                  <input
                    id="departmentId"
                    name="departmentId"
                    type="text"
                    autoComplete="address-level1"
                    placeholder="Departamento"
                    value={addressStep.departmentId}
                    onChange={(event) =>
                      updateAddressField("departmentId", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="districtId" className="sr-only">
                    Distrito
                  </label>
                  <input
                    id="districtId"
                    name="districtId"
                    type="text"
                    autoComplete="address-level3"
                    placeholder="Distrito"
                    value={addressStep.districtId}
                    onChange={(event) =>
                      updateAddressField("districtId", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="sr-only">
                    Ciudad
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Ciudad"
                    value={addressStep.city}
                    onChange={(event) =>
                      updateAddressField("city", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="addressLine" className="sr-only">
                    Dirección
                  </label>
                  <input
                    id="addressLine"
                    name="addressLine"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Dirección"
                    value={addressStep.addressLine}
                    onChange={(event) =>
                      updateAddressField("addressLine", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>
            ) : null}

            {activeStep === lastStepIndex ? (
              <dl className="mt-6 space-y-[14px] text-sm">
                {confirmationRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-2 items-baseline gap-3"
                  >
                    <dt className="text-right text-[#999999]">{label}</dt>
                    <dd className="min-w-0 break-words text-black">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div
              className={`${currentStep.navigationClassName} flex flex-wrap justify-end gap-2`}
            >
              {currentStep.previousLabel ? (
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className={`${navigationButtonClassName} ${currentStep.previousButtonClassName} border-[#1c21d1] bg-white text-[#1c21d1] hover:bg-[#f2f5fc]`}
                >
                  {currentStep.previousLabel}
                </button>
              ) : null}

              <button
                type="button"
                onClick={
                  activeStep < lastStepIndex ? goToNextStep : undefined
                }
                disabled={activeStep === lastStepIndex}
                className={`${navigationButtonClassName} ${currentStep.nextButtonClassName} border-[#1c21d1] bg-[#1c21d1] text-white hover:bg-[#171bb8] disabled:bg-[#1c21d1] disabled:text-white`}
              >
                {currentStep.nextLabel}
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden h-full items-end justify-end md:flex md:pr-2">
          <AuthIllustrationPanel variant="registro" />
        </aside>
      </div>
    </section>
  );
}
