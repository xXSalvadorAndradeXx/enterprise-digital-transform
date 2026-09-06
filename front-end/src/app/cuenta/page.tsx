import { Mail, Phone, UserRound } from "lucide-react";

const profileFields = [
  {
    label: "Nombre",
    value: "María Salgado",
    icon: UserRound,
  },
  {
    label: "Correo electrónico",
    value: "mariasalgado@gmail.com",
    icon: Mail,
  },
  {
    label: "Teléfono",
    value: "+503 7373 9099",
    icon: Phone,
  },
] as const;

export default function CuentaPage() {
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
