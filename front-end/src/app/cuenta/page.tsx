"use client";

import {
  clearAuthSession,
  hasActiveSession,
  readSessionUser,
  type AuthUser,
} from "@/lib/auth-session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

type SessionState = {
  isChecking: boolean;
  user: AuthUser | null;
};

export default function CuentaPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({
    isChecking: true,
    user: null,
  });

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (!hasActiveSession()) {
        router.replace("/login");
        return;
      }

      setSession({
        isChecking: false,
        user: readSessionUser(),
      });
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  if (session.isChecking) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_52%,#f9fafb_100%)] px-6 py-10">
        <div className="rounded-xl border border-sky-100 bg-white px-6 py-4 text-sm font-medium text-gray-600 shadow-md">
          Cargando tu cuenta...
        </div>
      </section>
    );
  }

  const displayName = session.user?.nombre || "Cliente";
  const displayEmail = session.user?.email || "Correo no disponible";
  const displayRole = session.user?.rol || "cliente";

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_46%,#f9fafb_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Sesión activa
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
                Bienvenido, {displayName}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                Este es tu espacio privado para revisar tu perfil, preparar compras y continuar navegando con tu sesión iniciada.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Correo
                      </p>
                      <p className="mt-0.5 break-all text-sm font-semibold text-gray-900">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Rol
                      </p>
                      <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900">
                        {displayRole}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
                >
                  Ir a comprar
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-600">
                      Panel privado
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-gray-950">
                      Tu cuenta en movimiento
                    </h2>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="mt-0.5 h-5 w-5 text-blue-700" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-gray-950">
                          Compras más rápidas
                        </p>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          Tu sesión quedó lista para futuras acciones del carrito y pedidos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <PackageCheck className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-gray-950">
                          Perfil verificado
                        </p>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          El acceso está protegido en el frontend usando tu token de sesión.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
