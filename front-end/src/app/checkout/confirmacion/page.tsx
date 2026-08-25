"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Check, Copy, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();

  const orderNumber =
    searchParams.get("orderNumber") ?? "";

  const customerType =
    searchParams.get("customerType") ?? "GUEST";

  useEffect(() => {
    if (customerType !== "GUEST") return;

    // Consumir el token una sola vez.
    // No se muestra, no se registra y no se envía por URL.
    sessionStorage.removeItem(
      "guestOrderAccessToken",
    );
  }, [customerType]);

  const copyOrderNumber = async () => {
    if (!orderNumber) return;

    await navigator.clipboard.writeText(
      orderNumber,
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-[900px] flex-col items-center px-5 py-10 text-center">

        {/* Icono */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-50" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
            <Check
              className="h-14 w-14 text-white"
              strokeWidth={3}
            />
          </div>

          <div className="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
            <ShoppingBag className="h-7 w-7 text-gray-300" />

            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <Check
                className="h-4 w-4 text-white"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <h1 className="text-4xl font-bold text-gray-950">
          ¡Compra realizada con éxito!
        </h1>

        <p className="mt-4 max-w-[650px] text-base leading-7 text-gray-500">
          Hemos enviado el comprobante de pago e
          información sobre el envío a tu correo
          electrónico.
        </p>

        {/* Número de orden */}
        <div className="mt-12 w-full max-w-[700px] rounded-xl bg-gray-50 px-6 py-9">
          <p className="text-2xl text-gray-600">
            Número de orden
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-gray-700">
              #{orderNumber || "—"}
            </span>

            {orderNumber && (
              <button
                type="button"
                onClick={copyOrderNumber}
                aria-label="Copiar número de orden"
                className="text-gray-500 transition hover:text-gray-800"
              >
                <Copy className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Información */}
        <p className="mt-8 text-base text-gray-700">
          Te hemos enviado un correo con los detalles de tu compra.
        </p>

        <p className="mt-1 text-base text-gray-700">
          Si no lo ves, revisa tu carpeta de spam.
        </p>

        {/* Acción */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/productos"
            className="rounded-md bg-[#1B21D1] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#1519A3]"
          >
            Seguir comprando
          </Link>

          {customerType !== "GUEST" && (
            <button
              type="button"
              disabled
              className="rounded-md border border-[#1B21D1] px-8 py-3 text-sm font-medium text-[#1B21D1]"
            >
              Ver mis pedidos
            </button>
          )}
        </div>
      </div>
    </main>
  );
}