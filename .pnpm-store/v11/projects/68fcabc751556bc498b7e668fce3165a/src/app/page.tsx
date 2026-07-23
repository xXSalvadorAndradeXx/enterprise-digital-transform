import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    title: "Catalogo actualizado",
    description: "Productos cargados desde la API del e-commerce.",
    icon: Truck,
  },
  {
    title: "Pago seguro",
    description: "Una experiencia preparada para compras confiables.",
    icon: ShieldCheck,
  },
  {
    title: "Compra sencilla",
    description: "Navega, filtra y revisa cada producto con claridad.",
    icon: CreditCard,
  },
];

export default function Home() {
  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-6 py-12 text-[#111111]">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase text-[#003791]">
            E-commerce tecnologico
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-[#111111] sm:text-5xl lg:text-6xl">
            Encuentra tecnologia para renovar tu espacio digital.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explora el catalogo conectado al backend, revisa disponibilidad y descubre productos por categoria, precio o busqueda.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003791] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(0,55,145,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-[0_20px_45px_rgba(0,91,255,0.26)]"
            >
              Ver productos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-[0_18px_45px_rgba(0,55,145,0.10)]">
          <div className="rounded-xl border border-[#D9E2EC] bg-[#EAF3FF] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#003791]">
                  Tienda online
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#111111]">
                  Catalogo en tiempo real
                </h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#003791] text-white shadow-[0_14px_30px_rgba(0,55,145,0.24)]">
                <ArrowRight className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex gap-3 rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F7FB] text-[#003791]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#111111]">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}