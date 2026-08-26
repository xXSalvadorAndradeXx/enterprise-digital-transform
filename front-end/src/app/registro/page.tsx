"use client";

import { AuthBenefitsBar } from "@/components/auth/AuthBenefitsBar";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import {
  registrationPasswordRequirements,
  registerFormSchema,
} from "@/lib/validations/auth.schemas";
import { locationsService } from "@/services/locations/locations.service";
import type { RegisterFormValues } from "@/types/auth/auth.types";
import type {
  Department,
  District,
} from "@/types/locations/location.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

const registrationSteps = [
  {
    id: "personal",
    progressLabel: "Información personal",
    title: "Crea una cuenta",
    contentClassName: "max-w-[330px]",
    positionClassName: "md:-translate-x-0.5 md:translate-y-[5px]",
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
const stepFields: Array<Array<keyof RegisterFormValues>> = [
  ["fullName", "dui", "phone"],
  ["email", "password"],
  ["departmentId", "districtId", "city", "addressLine"],
];

const initialFormData: RegisterFormValues = {
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

const inputClassName =
  "h-10 w-full rounded-lg border border-transparent bg-[#f7f7f8] px-5 text-sm text-[#4a4a4a] outline-none transition placeholder:text-[#929292] focus:border-[#1c21d1] focus:bg-white focus:ring-2 focus:ring-[#1c21d1]/10 aria-invalid:border-red-600 aria-invalid:focus:border-red-600 aria-invalid:focus:ring-red-600/10";
const navigationButtonClassName =
  "inline-flex h-[21px] items-center justify-center whitespace-nowrap rounded-[2px] border px-0 text-[9px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c21d1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100";

type CatalogStatus = "idle" | "loading" | "success" | "error";

interface CatalogState<T> {
  data: T[];
  status: CatalogStatus;
}

interface DistrictCatalogState extends CatalogState<District> {
  departmentId: number | null;
}

interface FieldErrorMessageProps {
  id: string;
  message?: string;
}

function FieldErrorMessage({ id, message }: FieldErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-1.5 px-1 text-xs text-red-600">
      {message}
    </p>
  );
}

function joinDescriptionIds(
  ...ids: Array<string | false | null | undefined>
) {
  const description = ids
    .filter((id): id is string => typeof id === "string")
    .join(" ");

  return description || undefined;
}

function parseLocationId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

export default function RegistroPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [departmentsCatalog, setDepartmentsCatalog] = useState<
    CatalogState<Department>
  >({ data: [], status: "loading" });
  const [districtsCatalog, setDistrictsCatalog] =
    useState<DistrictCatalogState>({
      data: [],
      departmentId: null,
      status: "idle",
    });
  const [departmentsRequestVersion, setDepartmentsRequestVersion] =
    useState(0);
  const [districtsRequestVersion, setDistrictsRequestVersion] = useState(0);
  const activeStepTitleRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(activeStep);
  const departmentsStartedVersionRef = useRef<number | null>(null);
  const departmentsRequestIdRef = useRef(0);
  const districtsRequestIdRef = useRef(0);
  const districtAbortControllerRef = useRef<AbortController | null>(null);
  const {
    clearErrors,
    control,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: initialFormData,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    shouldUnregister: false,
  });
  const formValues = useWatch({ control });
  const selectedDepartmentId = formValues.departmentId ?? null;
  const selectedDistrictId = formValues.districtId ?? null;
  const passwordValue = formValues.password ?? "";
  const previousDepartmentIdRef = useRef(selectedDepartmentId);
  const lastStepIndex = registrationSteps.length - 1;
  const currentStep = registrationSteps[activeStep];
  const isDistrictCatalogCurrent =
    selectedDepartmentId !== null &&
    districtsCatalog.departmentId === selectedDepartmentId;
  const currentDistrictStatus: CatalogStatus = selectedDepartmentId === null
    ? "idle"
    : isDistrictCatalogCurrent
      ? districtsCatalog.status
      : "loading";
  const availableDistricts = isDistrictCatalogCurrent
    ? districtsCatalog.data
    : [];
  const selectedDepartmentLabel =
    departmentsCatalog.data.find(
      (department) => department.id === selectedDepartmentId,
    )?.name ?? "";
  const selectedDistrictLabel =
    availableDistricts.find((district) => district.id === selectedDistrictId)
      ?.name ?? "";
  const departmentStatusMessage =
    departmentsCatalog.status === "loading"
      ? "Cargando departamentos..."
      : departmentsCatalog.status === "success" &&
          departmentsCatalog.data.length === 0
        ? "No hay departamentos disponibles"
        : null;
  const districtStatusMessage =
    currentDistrictStatus === "loading"
      ? "Cargando distritos..."
      : currentDistrictStatus === "success" &&
          availableDistricts.length === 0
        ? "No hay distritos disponibles"
        : null;
  const departmentPlaceholder = departmentStatusMessage ?? "Departamento";
  const districtPlaceholder = selectedDepartmentId === null
    ? "Selecciona primero un departamento"
    : (districtStatusMessage ?? "Distrito");
  const isDepartmentSelectDisabled =
    departmentsCatalog.status !== "success" ||
    departmentsCatalog.data.length === 0;
  const isDistrictSelectDisabled =
    selectedDepartmentId === null ||
    currentDistrictStatus !== "success" ||
    availableDistricts.length === 0;
  const departmentDescriptionIds = joinDescriptionIds(
    Boolean(errors.departmentId) && "departmentId-error",
    departmentStatusMessage && "department-catalog-status",
    departmentsCatalog.status === "error" && "department-catalog-error",
  );
  const districtDescriptionIds = joinDescriptionIds(
    Boolean(errors.districtId) && "districtId-error",
    districtStatusMessage && "district-catalog-status",
    currentDistrictStatus === "error" && "district-catalog-error",
  );
  const confirmationRows = [
    ["Nombre completo:", formValues.fullName],
    ["Teléfono:", formValues.phone],
    ["Email:", formValues.email],
    ["Dirección:", formValues.addressLine],
    ["Ciudad:", formValues.city],
    ["Departamento:", selectedDepartmentLabel],
    ["Distrito", selectedDistrictLabel],
  ] as const;

  useEffect(() => {
    if (
      activeStep !== editableSteps.length - 1 ||
      departmentsStartedVersionRef.current === departmentsRequestVersion
    ) {
      return;
    }

    departmentsStartedVersionRef.current = departmentsRequestVersion;
    const requestId = ++departmentsRequestIdRef.current;
    const controller = new AbortController();
    let requestCompleted = false;

    queueMicrotask(() => {
      if (
        controller.signal.aborted ||
        requestId !== departmentsRequestIdRef.current
      ) {
        return;
      }

      void locationsService
        .getDepartments(controller.signal)
        .then((departments) => {
          if (
            controller.signal.aborted ||
            requestId !== departmentsRequestIdRef.current
          ) {
            return;
          }

          requestCompleted = true;
          setDepartmentsCatalog({ data: departments, status: "success" });
        })
        .catch(() => {
          if (
            controller.signal.aborted ||
            requestId !== departmentsRequestIdRef.current
          ) {
            return;
          }

          requestCompleted = true;
          setDepartmentsCatalog({ data: [], status: "error" });
        });
    });

    return () => {
      controller.abort();

      if (
        !requestCompleted &&
        departmentsStartedVersionRef.current === departmentsRequestVersion
      ) {
        departmentsStartedVersionRef.current = null;
      }
    };
  }, [activeStep, departmentsRequestVersion]);

  useEffect(() => {
    if (previousStepRef.current === activeStep) {
      return;
    }

    previousStepRef.current = activeStep;
    activeStepTitleRef.current?.focus();
  }, [activeStep]);

  useEffect(() => {
    if (previousDepartmentIdRef.current !== selectedDepartmentId) {
      previousDepartmentIdRef.current = selectedDepartmentId;
      setValue("districtId", null, { shouldDirty: true });
      clearErrors("districtId");
    }

    districtAbortControllerRef.current?.abort();
    const requestId = ++districtsRequestIdRef.current;

    if (selectedDepartmentId === null) {
      districtAbortControllerRef.current = null;
      return;
    }

    const controller = new AbortController();
    districtAbortControllerRef.current = controller;

    queueMicrotask(() => {
      if (
        controller.signal.aborted ||
        requestId !== districtsRequestIdRef.current
      ) {
        return;
      }

      void locationsService
        .getDistricts(selectedDepartmentId, controller.signal)
        .then((districts) => {
          if (
            controller.signal.aborted ||
            requestId !== districtsRequestIdRef.current
          ) {
            return;
          }

          setDistrictsCatalog({
            data: districts,
            departmentId: selectedDepartmentId,
            status: "success",
          });
        })
        .catch(() => {
          if (
            controller.signal.aborted ||
            requestId !== districtsRequestIdRef.current
          ) {
            return;
          }

          setDistrictsCatalog({
            data: [],
            departmentId: selectedDepartmentId,
            status: "error",
          });
        });
    });

    return () => {
      controller.abort();

      if (districtAbortControllerRef.current === controller) {
        districtAbortControllerRef.current = null;
      }
    };
  }, [
    clearErrors,
    districtsRequestVersion,
    selectedDepartmentId,
    setValue,
  ]);

  const goToPreviousStep = () => {
    setActiveStep((currentStepIndex) =>
      Math.max(currentStepIndex - 1, 0),
    );
  };

  const goToNextStep = async () => {
    if (activeStep >= editableSteps.length) {
      return;
    }

    const isCurrentStepValid = await trigger(stepFields[activeStep], {
      shouldFocus: true,
    });

    if (!isCurrentStepValid) {
      return;
    }

    setActiveStep((currentStepIndex) =>
      Math.min(currentStepIndex + 1, lastStepIndex),
    );
  };

  const selectStep = (stepIndex: number) => {
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
      return;
    }

    void goToNextStep();
  };

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
              const isUnavailable = stepIndex > activeStep + 1;

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
                    onClick={() => selectStep(stepIndex)}
                    disabled={isUnavailable}
                    className="flex w-full min-w-0 items-center justify-center gap-2 disabled:cursor-not-allowed sm:justify-start sm:gap-3"
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
          <form
            className={`w-full ${currentStep.contentClassName} ${currentStep.positionClassName}`}
            onSubmit={(event) => {
              event.preventDefault();
              void goToNextStep();
            }}
            noValidate
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
                    type="text"
                    autoComplete="name"
                    placeholder="Nombre completo"
                    {...register("fullName")}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                  />
                  <FieldErrorMessage
                    id="fullName-error"
                    message={errors.fullName?.message}
                  />
                </div>

                <div>
                  <label htmlFor="dui" className="sr-only">
                    Documento Único de Identidad (DUI)
                  </label>
                  <input
                    id="dui"
                    type="text"
                    inputMode="numeric"
                    placeholder="Documento Único de Identidad (DUI)"
                    {...register("dui")}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.dui)}
                    aria-describedby={errors.dui ? "dui-error" : undefined}
                  />
                  <FieldErrorMessage
                    id="dui-error"
                    message={errors.dui?.message}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="sr-only">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Teléfono"
                    {...register("phone")}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={
                      errors.phone ? "phone-error" : undefined
                    }
                  />
                  <FieldErrorMessage
                    id="phone-error"
                    message={errors.phone?.message}
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
                      type="email"
                      autoComplete="email"
                      placeholder="Correo"
                      {...register("email")}
                      className={`${inputClassName} pr-11`}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                    />
                    <Mail
                      className="pointer-events-none absolute top-1/2 right-4 h-[18px] w-[18px] -translate-y-1/2 text-[#93969d]"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>
                  <FieldErrorMessage
                    id="email-error"
                    message={errors.email?.message}
                  />
                </div>

                <div className="mt-[14px]">
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Contraseña"
                      {...register("password")}
                      className={`${inputClassName} pr-11`}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password
                          ? "password-error password-requirements"
                          : "password-requirements"
                      }
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
                  <FieldErrorMessage
                    id="password-error"
                    message={errors.password?.message}
                  />
                </div>

                <div
                  id="password-requirements"
                  className="mt-px px-0.5 text-[#929292]"
                >
                  <p className="text-[11px] font-semibold text-[#363636]">
                    La contraseña debe contener:
                  </p>
                  <ul className="mt-0.5">
                    {registrationPasswordRequirements.map((requirement) => {
                      const isMet = requirement.isMet(passwordValue);

                      return (
                        <li
                          key={requirement.id}
                          className={`flex items-center gap-2 text-[10px] leading-[14px] ${
                            isMet ? "text-emerald-600" : "text-[#929292]"
                          }`}
                        >
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          <span>{requirement.label}</span>
                          <span className="sr-only">
                            {isMet ? " cumplido" : " pendiente"}
                          </span>
                        </li>
                      );
                    })}
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
                  <Controller
                    name="departmentId"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="departmentId"
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const nextDepartmentId = parseLocationId(
                            event.target.value,
                          );

                          if (nextDepartmentId !== selectedDepartmentId) {
                            districtAbortControllerRef.current?.abort();
                            previousDepartmentIdRef.current = nextDepartmentId;
                            setValue("districtId", null, {
                              shouldDirty: true,
                            });
                            clearErrors("districtId");
                            setDistrictsCatalog({
                              data: [],
                              departmentId: nextDepartmentId,
                              status:
                                nextDepartmentId === null ? "idle" : "loading",
                            });
                          }

                          field.onChange(nextDepartmentId);
                        }}
                        disabled={isDepartmentSelectDisabled}
                        className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                        aria-invalid={Boolean(errors.departmentId)}
                        aria-describedby={departmentDescriptionIds}
                        aria-busy={departmentsCatalog.status === "loading"}
                      >
                        <option value="">{departmentPlaceholder}</option>
                        {departmentsCatalog.data.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {departmentStatusMessage ? (
                    <p
                      id="department-catalog-status"
                      role="status"
                      className="sr-only"
                    >
                      {departmentStatusMessage}
                    </p>
                  ) : null}
                  {departmentsCatalog.status === "error" ? (
                    <div
                      id="department-catalog-error"
                      role="alert"
                      className="mt-1.5 flex items-center justify-between gap-3 px-1 text-xs text-red-600"
                    >
                      <span>No pudimos cargar los departamentos.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDepartmentsCatalog({
                            data: [],
                            status: "loading",
                          });
                          setDepartmentsRequestVersion(
                            (currentVersion) => currentVersion + 1,
                          );
                        }}
                        className="shrink-0 font-semibold text-[#1c21d1] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c21d1]"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : null}
                  <FieldErrorMessage
                    id="departmentId-error"
                    message={errors.departmentId?.message}
                  />
                </div>

                <div>
                  <label htmlFor="districtId" className="sr-only">
                    Distrito
                  </label>
                  <Controller
                    name="districtId"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="districtId"
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(event) =>
                          field.onChange(parseLocationId(event.target.value))
                        }
                        disabled={isDistrictSelectDisabled}
                        className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                        aria-invalid={Boolean(errors.districtId)}
                        aria-describedby={districtDescriptionIds}
                        aria-busy={currentDistrictStatus === "loading"}
                      >
                        <option value="">{districtPlaceholder}</option>
                        {availableDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {districtStatusMessage ? (
                    <p
                      id="district-catalog-status"
                      role="status"
                      className="sr-only"
                    >
                      {districtStatusMessage}
                    </p>
                  ) : null}
                  {currentDistrictStatus === "error" ? (
                    <div
                      id="district-catalog-error"
                      role="alert"
                      className="mt-1.5 flex items-center justify-between gap-3 px-1 text-xs text-red-600"
                    >
                      <span>No pudimos cargar los distritos.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDistrictsCatalog({
                            data: [],
                            departmentId: selectedDepartmentId,
                            status: "loading",
                          });
                          setDistrictsRequestVersion(
                            (currentVersion) => currentVersion + 1,
                          );
                        }}
                        className="shrink-0 font-semibold text-[#1c21d1] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c21d1]"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : null}
                  <FieldErrorMessage
                    id="districtId-error"
                    message={errors.districtId?.message}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="sr-only">
                    Ciudad
                  </label>
                  <input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Ciudad"
                    {...register("city")}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? "city-error" : undefined}
                  />
                  <FieldErrorMessage
                    id="city-error"
                    message={errors.city?.message}
                  />
                </div>

                <div>
                  <label htmlFor="addressLine" className="sr-only">
                    Dirección
                  </label>
                  <input
                    id="addressLine"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Dirección"
                    {...register("addressLine")}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.addressLine)}
                    aria-describedby={
                      errors.addressLine ? "addressLine-error" : undefined
                    }
                  />
                  <FieldErrorMessage
                    id="addressLine-error"
                    message={errors.addressLine?.message}
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
                type={activeStep < lastStepIndex ? "submit" : "button"}
                disabled={activeStep === lastStepIndex}
                className={`${navigationButtonClassName} ${currentStep.nextButtonClassName} border-[#1c21d1] bg-[#1c21d1] text-white hover:bg-[#171bb8] disabled:bg-[#1c21d1] disabled:text-white`}
              >
                {currentStep.nextLabel}
              </button>
            </div>
          </form>
        </main>

        <aside className="hidden h-full items-end justify-end md:flex md:pr-2">
          <AuthIllustrationPanel variant="registro" />
        </aside>
      </div>
    </section>
  );
}
