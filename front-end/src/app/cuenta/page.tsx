"use client";

import { LoaderCircle, Mail, Phone, UserRound } from "lucide-react";
import { useCustomerProfile } from "@/hooks/profile/useCustomerProfile";

export default function CuentaPage() {
  const { profile, isLoading, error, retry } = useCustomerProfile();
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

      <section
        aria-label="Información personal"
        className="mt-8 rounded-[22px] border border-[#a8adb6] bg-white p-4 sm:p-10"
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
        ) : profile ? (
          <dl className="space-y-5 sm:space-y-6">
            {profileFields.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex min-h-24 items-center gap-4 rounded-[17px] border border-[#a8adb6] px-4 py-4 sm:min-h-[106px] sm:gap-8 sm:px-6"
              >
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#f1f4ff] text-[#2528dc] sm:h-16 sm:w-16">
                  <Icon
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
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
      </section>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="h-12 w-full rounded bg-[#2528dc] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1e21bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2528dc] sm:w-[182px]"
        >
          Editar perfil
        </button>
      </div>
    </section>
  );
}
