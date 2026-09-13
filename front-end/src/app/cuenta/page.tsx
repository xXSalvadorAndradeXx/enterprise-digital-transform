"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Heart,
  LoaderCircle,
  Lock,
  MapPin,
  Package,
  Pencil,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useForm } from "react-hook-form";

import { useCustomerProfile } from "@/hooks/profile/useCustomerProfile";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import {
  normalizeProfilePhone,
  updateCustomerProfileSchema,
} from "@/lib/validations/profile.schema";
import type { UpdateCustomerProfileRequest } from "@/types/profile/profile.types";

type ProfileFeedback =
  | { type: "success" }
  | { type: "error"; message: string }
  | null;

function ProfileFeedbackBanner({
  feedback,
  onClose,
  closeButtonRef,
}: {
  feedback: Exclude<ProfileFeedback, null>;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const isSuccess = feedback.type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`mb-6 flex items-start justify-between gap-3 rounded-lg border p-4 shadow-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
          : "border-red-200 bg-red-50/80 text-red-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            isSuccess ? "text-emerald-600" : "text-red-600"
          }`}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold">
            {isSuccess ? "¡Perfil actualizado con éxito!" : "No se pudo actualizar el perfil"}
          </p>
          <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">
            {isSuccess
              ? "Tus datos personales se han guardado correctamente."
              : feedback.message}
          </p>
        </div>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="rounded-md p-1 text-stone-500 transition-colors hover:bg-black/5 hover:text-stone-800"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function CuentaPage() {
  const { profile, isLoading, error, isUpdating, retry, updateProfile } =
    useCustomerProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);

  const feedbackCloseButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

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

  const dismissFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  // Sync default form values when opening edit modal or when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        phone: profile.phone ?? "",
      });
    }
  }, [profile, reset]);

  // Keyboard shortcut (Escape) for closing modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen]);

  // Auto-dismiss feedback after 5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(dismissFeedback, 5000);
    return () => window.clearTimeout(timer);
  }, [dismissFeedback, feedback]);

  const openEditModal = () => {
    if (!profile) return;
    reset({
      name: profile.name,
      phone: profile.phone ?? "",
    });
    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSubmitting || isUpdating) return;
    setIsEditModalOpen(false);
  };

  const onSubmit = async (values: UpdateCustomerProfileRequest) => {
    setFeedback(null);
    try {
      const updated = await updateProfile({
        name: values.name.trim(),
        phone: normalizeProfilePhone(values.phone),
      });

      if (!updated) return;

      reset({
        name: updated.name,
        phone: updated.phone ?? "",
      });
      setIsEditModalOpen(false);
      setFeedback({ type: "success" });
      editButtonRef.current?.focus();
    } catch {
      setFeedback({
        type: "error",
        message:
          "Ocurrió un error al actualizar tus datos. Verifica tu conexión e inténtalo de nuevo.",
      });
    }
  };

  const formattedPhone = profile?.phone
    ? profile.phone.startsWith("+503")
      ? profile.phone
      : `+503 ${profile.phone}`
    : "Sin teléfono registrado";

  return (
    <div className="mx-auto w-full max-w-[1000px] pb-16 pt-6 sm:pt-8">
      {/* Encabezado principal */}
      <AccountPageHeader
        title="Mi Perfil"
        description="Actualiza tu información personal y mantén tus datos de contacto al día."
      />

      {/* Banner de Feedback */}
      {feedback && (
        <ProfileFeedbackBanner
          feedback={feedback}
          onClose={dismissFeedback}
          closeButtonRef={feedbackCloseButtonRef}
        />
      )}

      {/* Estado: Cargando */}
      {isLoading ? (
        <div
          role="status"
          className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-8 text-stone-500 shadow-sm"
        >
          <LoaderCircle className="h-8 w-8 animate-spin text-stone-700" aria-hidden="true" />
          <span className="mt-3 text-sm font-medium">Cargando los datos de tu cuenta...</span>
        </div>
      ) : error ? (
        /* Estado: Error */
        <div
          role="alert"
          className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"
        >
          <XCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold text-stone-900">
            No se pudo cargar la información de tu perfil
          </p>
          <p className="mt-1 text-sm text-stone-500">{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#2528dc] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1e21bf]"
          >
            Reintentar
          </button>
        </div>
      ) : profile ? (
        /* Vista Principal: Ficha Técnica / Tarjeta Clásica */
        <div className="space-y-8">
          {/* Tarjeta de Ficha de Perfil */}
          <section
            aria-label="Datos del perfil de usuario"
            className="rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow"
          >
            {/* Cabecera de la ficha */}
            <div className="flex flex-col gap-4 border-b border-stone-100 bg-[#FAFAFA] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-xs">
                  <User className="h-7 w-7 text-stone-600" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900 sm:text-xl">
                      {profile.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Cuenta activa
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 sm:text-sm">
                    Cliente registrado en Woden
                  </p>
                </div>
              </div>

              {/* Botón de acción principal: Editar información */}
              <button
                ref={editButtonRef}
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2528dc] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] sm:w-auto"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span>Editar información</span>
              </button>
            </div>

            {/* Lista estructurada de datos (Ficha técnica) */}
            <div className="divide-y divide-stone-100 px-6 py-2">
              {/* Fila: Nombre completo */}
              <div className="grid grid-cols-1 gap-1.5 py-4 sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-stone-500">
                  Nombre completo
                </dt>
                <dd className="text-sm font-semibold text-stone-900 sm:col-span-2">
                  {profile.name}
                </dd>
              </div>

              {/* Fila: Correo electrónico */}
              <div className="grid grid-cols-1 gap-1.5 py-4 sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-stone-500">
                  Correo electrónico
                </dt>
                <dd className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-900 sm:col-span-2">
                  <span>{profile.email}</span>
                  <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                    Principal
                  </span>
                </dd>
              </div>

              {/* Fila: Número de teléfono */}
              <div className="grid grid-cols-1 gap-1.5 py-4 sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-stone-500">
                  Número de teléfono
                </dt>
                <dd className="text-sm font-semibold text-stone-900 sm:col-span-2">
                  {formattedPhone}
                </dd>
              </div>
            </div>
          </section>

        </div>
      ) : null}

      {/* Modal de Edición: Estado Interactivo */}
      {isEditModalOpen && profile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior del modal */}
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h3
                  id="edit-modal-title"
                  className="text-lg font-bold text-stone-900 sm:text-xl"
                >
                  Editar Datos Personales
                </h3>
                <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
                  Modifica los datos de tu cuenta personal en la tienda.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSubmitting || isUpdating}
                aria-label="Cerrar modal de edición"
                className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Formulario clásico bordeado */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-4 px-6 py-5">
                {/* Campo: Nombre completo */}
                <div>
                  <label
                    htmlFor="edit-profile-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="edit-profile-name"
                      type="text"
                      {...register("name")}
                      placeholder="Ej. Juan Pérez"
                      autoComplete="name"
                      maxLength={150}
                      disabled={isSubmitting || isUpdating}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "edit-name-error" : undefined}
                      className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs outline-none transition placeholder:text-stone-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-70 ${
                        errors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                          : "border-stone-300 focus:border-stone-900 focus:ring-stone-100"
                      }`}
                    />
                  </div>
                  {errors.name?.message && (
                    <p id="edit-name-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Campo: Correo electrónico (Solo lectura) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="edit-profile-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                    >
                      Correo electrónico
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                      <Lock className="h-3 w-3" />
                      No modificable
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="edit-profile-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      disabled
                      autoComplete="email"
                      className="block w-full rounded-lg border border-stone-200 bg-stone-100 px-3.5 py-2.5 text-sm font-medium text-stone-500 shadow-xs cursor-not-allowed outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    El correo electrónico está vinculado a tu cuenta y acceso a la tienda.
                  </p>
                </div>

                {/* Campo: Teléfono */}
                <div>
                  <label
                    htmlFor="edit-profile-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Número de teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="edit-profile-phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="Ej. 7123-4567 o +503 7123-4567"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={14}
                      disabled={isSubmitting || isUpdating}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "edit-phone-error" : undefined}
                      className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs outline-none transition placeholder:text-stone-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-70 ${
                        errors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                          : "border-stone-300 focus:border-stone-900 focus:ring-stone-100"
                      }`}
                    />
                  </div>
                  {errors.phone?.message ? (
                    <p id="edit-phone-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {errors.phone.message}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-stone-400">
                      Número de 8 dígitos para avisos de entrega y paquetería.
                    </p>
                  )}
                </div>
              </div>

              {/* Pie del modal: Botones de Acción */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-[#FAFAFA] px-6 py-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSubmitting || isUpdating}
                  className="rounded-lg border border-[#2528dc] bg-white px-4 py-2.5 text-sm font-medium text-[#2528dc] shadow-xs transition hover:bg-[#eef0ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isDirty || !isValid || isSubmitting || isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2528dc] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting || isUpdating ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Guardando cambios...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
