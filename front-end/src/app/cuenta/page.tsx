"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useCustomerProfile } from "@/hooks/profile/useCustomerProfile";
import {
  normalizeProfilePhone,
  updateCustomerProfileSchema,
} from "@/lib/validations/profile.schema";
import type { UpdateCustomerProfileRequest } from "@/types/profile/profile.types";

type ProfileFeedback =
  | { type: "success" }
  | { type: "error"; message: string }
  | null;

const inputClassName =
  "mt-1 w-full bg-transparent text-lg leading-tight text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2528dc] sm:text-[26px]";

function ProfileFeedbackPanel({ feedback }: { feedback: Exclude<ProfileFeedback, null> }) {
  const isSuccess = feedback.type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center p-2 sm:inset-10">
      <div
        className="w-full max-w-[666px] rounded-[17px] bg-[#f7f7f7] px-6 py-8 text-center shadow-[0_10px_25px_rgba(0,0,0,0.03)] sm:px-12"
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
      >
        <Icon
          className={`mx-auto h-14 w-14 ${isSuccess ? "text-[#50bd5c]" : "text-[#ff453b]"}`}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <p
          className={`mt-5 text-2xl font-semibold sm:text-[26px] ${
            isSuccess ? "text-[#50bd5c]" : "text-[#ff453b]"
          }`}
        >
          {isSuccess ? "¡Perfil actualizado!" : "¡Algo salió mal!"}
        </p>
        <p className="mt-4 text-sm font-medium leading-6 text-[#565656] sm:text-base">
          {isSuccess
            ? "Tus datos se han actualizado correctamente"
            : feedback.message}
        </p>
      </div>
    </div>
  );
}

export default function CuentaPage() {
  const { profile, isLoading, error, isUpdating, retry, updateProfile } =
    useCustomerProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<UpdateCustomerProfileRequest>({
    resolver: zodResolver(updateCustomerProfileSchema),
    defaultValues: { name: "", phone: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(
      () => setFeedback(null),
      feedback.type === "success" ? 3_000 : 5_000,
    );

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const profileFields = profile
    ? [
        { label: "Nombre", value: profile.name, icon: UserRound },
        { label: "Correo electrónico", value: profile.email, icon: Mail },
        {
          label: "Teléfono",
          value: profile.phone ?? "Sin teléfono registrado",
          icon: Phone,
        },
      ]
    : [];

  const beginEditing = () => {
    if (!profile) return;

    reset({ name: profile.name, phone: profile.phone ?? "" });
    setFeedback(null);
    setIsEditing(true);
  };

  const submitProfile = async (values: UpdateCustomerProfileRequest) => {
    setFeedback(null);

    try {
      const updatedProfile = await updateProfile({
        name: values.name,
        phone: normalizeProfilePhone(values.phone),
      });

      if (!updatedProfile) return;

      reset({
        name: updatedProfile.name,
        phone: updatedProfile.phone ?? "",
      });
      setIsEditing(false);
      setFeedback({ type: "success" });
    } catch {
      setFeedback({
        type: "error",
        message:
          "No pudimos actualizar tus datos. Por favor, inténtalo nuevamente.",
      });
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1000px] pb-12 pt-10 sm:pt-14 lg:pt-[72px]">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-[42px] sm:leading-tight">
          Mi Perfil
        </h1>
        <p className="mt-3 text-base text-[#565656] sm:text-xl">
          Actualiza tu información personal y mantén tus datos actualizados.
        </p>
      </header>

      <form onSubmit={handleSubmit(submitProfile)} noValidate>
        <section
          aria-label="Información personal"
          className="relative mt-8 rounded-[22px] border border-[#a8adb6] bg-white p-4 sm:p-10"
        >
          {isLoading ? (
            <div
              role="status"
              className="flex min-h-[328px] w-full min-w-0 items-center justify-center gap-3 text-lg text-[#565656] sm:min-h-[366px]"
            >
              <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
              <span className="min-w-0 break-words">
                Cargando los datos de tu perfil...
              </span>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex min-h-[328px] flex-col items-center justify-center gap-4 text-center sm:min-h-[366px]"
            >
              <div className="w-full min-w-0">
                <p className="text-lg font-medium text-black">
                  No pudimos cargar tu perfil.
                </p>
                <p className="mt-1 break-words text-base text-[#565656]">
                  {error.message}
                </p>
              </div>
              <button
                type="button"
                onClick={retry}
                className="h-12 rounded bg-[#2528dc] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc]"
              >
                Reintentar
              </button>
            </div>
          ) : profile && isEditing ? (
            <dl className="space-y-5 sm:space-y-6">
              <div
                className={`flex min-h-24 items-center gap-4 rounded-[17px] border px-4 py-4 sm:min-h-[106px] sm:gap-8 sm:px-6 ${
                  errors.name ? "border-red-500" : "border-[#a8adb6]"
                }`}
              >
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f1f4ff] text-[#2528dc] sm:h-16 sm:w-16">
                  <UserRound className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <dt>
                    <label htmlFor="profile-name" className="text-lg font-medium leading-tight text-black sm:text-[26px]">
                      Nombre:
                    </label>
                  </dt>
                  <dd>
                    <input
                      id="profile-name"
                      {...register("name")}
                      className={inputClassName}
                      autoComplete="name"
                      maxLength={150}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "profile-name-error" : undefined}
                    />
                    {errors.name?.message ? (
                      <p id="profile-name-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.name.message}
                      </p>
                    ) : null}
                  </dd>
                </div>
              </div>

              <div className="flex min-h-24 items-center gap-4 rounded-[17px] border border-[#a8adb6] px-4 py-4 sm:min-h-[106px] sm:gap-8 sm:px-6">
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f1f4ff] text-[#2528dc] sm:h-16 sm:w-16">
                  <Mail className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <dt>
                    <label htmlFor="profile-email" className="text-lg font-medium leading-tight text-black sm:text-[26px]">
                      Correo electrónico:
                    </label>
                  </dt>
                  <dd>
                    <input
                      id="profile-email"
                      value={profile.email}
                      readOnly
                      aria-readonly="true"
                      className={inputClassName}
                      autoComplete="email"
                    />
                  </dd>
                </div>
              </div>

              <div
                className={`flex min-h-24 items-center gap-4 rounded-[17px] border px-4 py-4 sm:min-h-[106px] sm:gap-8 sm:px-6 ${
                  errors.phone ? "border-red-500" : "border-[#a8adb6]"
                }`}
              >
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f1f4ff] text-[#2528dc] sm:h-16 sm:w-16">
                  <Phone className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <dt>
                    <label htmlFor="profile-phone" className="text-lg font-medium leading-tight text-black sm:text-[26px]">
                      Teléfono:
                    </label>
                  </dt>
                  <dd>
                    <input
                      id="profile-phone"
                      {...register("phone")}
                      className={inputClassName}
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={14}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "profile-phone-error" : undefined}
                    />
                    {errors.phone?.message ? (
                      <p id="profile-phone-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.phone.message}
                      </p>
                    ) : null}
                  </dd>
                </div>
              </div>
            </dl>
          ) : profile ? (
            <dl className="space-y-5 sm:space-y-6">
              {profileFields.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-h-24 items-center gap-4 rounded-[17px] border border-[#a8adb6] px-4 py-4 sm:min-h-[106px] sm:gap-8 sm:px-6"
                >
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f1f4ff] text-[#2528dc] sm:h-16 sm:w-16">
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-lg font-medium leading-tight text-black sm:text-[26px]">
                      {label}:
                    </dt>
                    <dd className="mt-1 break-words text-lg leading-tight text-black sm:text-[26px]">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          ) : null}

          {feedback ? <ProfileFeedbackPanel feedback={feedback} /> : null}
        </section>

        {!isLoading && !error && profile ? (
          <div className="mt-6 flex justify-end">
            {isEditing ? (
              <button
                key="save-profile"
                type="submit"
                disabled={!isDirty || !isValid || isSubmitting || isUpdating}
                className="h-12 w-full rounded bg-[#2528dc] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-[182px]"
              >
                {isSubmitting || isUpdating
                  ? "Guardando cambios..."
                  : "Guardar cambios"}
              </button>
            ) : (
              <button
                key="edit-profile"
                type="button"
                onClick={beginEditing}
                className="h-12 w-full rounded bg-[#2528dc] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-[182px]"
              >
                Editar perfil
              </button>
            )}
          </div>
        ) : null}
      </form>
    </section>
  );
}
