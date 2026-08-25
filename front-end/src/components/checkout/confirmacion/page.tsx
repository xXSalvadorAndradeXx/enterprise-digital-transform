"use client";

import { useSearchParams } from "next/navigation";
import { Check, Copy, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CheckoutConfirmationPage() {
  const searchParams = useSearchParams();

  const orderNumber =
    searchParams.get("orderNumber") || "AR123456";

  const customerType =
    searchParams.get("customerType") || "GUEST";

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "No se pudo copiar el número de orden:",
        error,
      );
    }
  };

  const isLoggedIn =
    customerType === "AUTHENTICATED";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center px-5 py-10">

        <div className="mb-8 flex h-[180px] w-full max-w-[520px] items-center justify-center">
          <div className="relative flex items-center justify-center">

            <div className="absolute h-32 w-32 rounded-full bg-green-50" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
              <Check
                className="h-14 w-14 text-white"
                strokeWidth={3}
              />
            </div>

            <div className="absolute left-20 top-16 flex h-20 w-16 items-center justify-center rounded-lg border-2 border-gray-200 bg-white shadow-sm">
              <ShoppingBag
                className="h-10 w-10 text-gray-300"
                strokeWidth={1.5}
              />

              <div className="absolute -bottom-1 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                <Check
                  className="h-4 w-4 text-white"
                  strokeWidth={3}
                />
              </div>
            </div>

          </div>
        </div>

        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          ¡Compra realizada con éxito!
        </h1>

        <p className="mt-5 max-w-[650px] text-center text-base leading-relaxed text-gray-500">
          Hemos enviado el comprobante de pago e
          información sobre el envío a tu correo
          electrónico.
        </p>

        <section className="mt-12 w-full max-w-[710px] rounded-xl bg-gray-50 px-6 py-8 text-center">
          <p className="text-2xl text-gray-600">
            Número de orden
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-gray-700">
              #{orderNumber}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              title="Copiar número de orden"
              className="rounded-md p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
            >
              {copied ? (
                <Check
                  className="h-5 w-5 text-green-600"
                  aria-hidden="true"
                />
              ) : (
                <Copy
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {copied && (
            <p className="mt-2 text-xs text-green-600">
              Número de orden copiado
            </p>
          )}
        </section>

        <p className="mt-7 max-w-[650px] text-center text-base leading-relaxed text-gray-700">
          Te hemos enviado un correo con los detalles
          de tu compra.
          <br />
          Si no lo ves, revisa tu carpeta de spam.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="rounded-md bg-[#1B21D1] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#1519A3]"
          >
            Seguir comprando
          </button>

          {isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/cuenta/pedidos";
              }}
              className="rounded-md border border-[#1B21D1] px-8 py-3 text-sm font-medium text-[#1B21D1] transition hover:bg-[#1B21D1]/5"
            >
              Ver mis pedidos
            </button>
          )}

        </div>

      </div>
    </main>
  );
}