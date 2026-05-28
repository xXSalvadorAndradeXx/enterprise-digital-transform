"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  LogIn,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  readAccessToken,
} from "@/lib/auth-session";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/context/CartContext";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatPrice(price: number) {
  return priceFormatter.format(Number.isFinite(price) ? price : 0);
}

function getItemSubtotal(item: CartItem) {
  return Number.isFinite(item.subtotal) ? item.subtotal : item.precio * item.quantity;
}

export default function CarritoPage() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<number[]>([]);
  const [pendingAction, setPendingAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const updateSessionState = () => {
      setHasSession(Boolean(readAccessToken()));
      setSessionChecked(true);
    };

    updateSessionState();
    window.addEventListener("storage", updateSessionState);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, updateSessionState);

    return () => {
      window.removeEventListener("storage", updateSessionState);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, updateSessionState);
    };
  }, []);

  const runCartAction = async (actionId: string, action: () => Promise<void>) => {
    setPendingAction(actionId);
    setErrorMessage("");

    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el carrito.",
      );
    } finally {
      setPendingAction("");
    }
  };

  const markImageAsFailed = (itemId: number) => {
    setFailedImageIds((currentIds) =>
      currentIds.includes(itemId) ? currentIds : [...currentIds, itemId],
    );
  };

  if (!sessionChecked) {
    return (
      <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#D9E2EC] bg-white p-6 shadow-[0_16px_40px_rgba(0,55,145,0.08)]">
          <p className="text-sm font-semibold text-slate-600">Cargando carrito...</p>
        </div>
      </section>
    );
  }

  if (!hasSession) {
    return (
      <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-[#D9E2EC] bg-white px-6 py-10 text-center shadow-[0_16px_40px_rgba(0,55,145,0.10)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]">
            <LogIn className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
            Inicia sesión para ver tu carrito
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Tu carrito se sincroniza con tu cuenta para mantener tus productos guardados.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#003791] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(0,55,145,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md"
          >
            Ir a Login
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10 lg:px-8">
        <div className="flex w-full flex-col items-center text-center">
          <Image
            src="/images/empty-cart-robot.png"
            width={1122}
            height={1402}
            alt="Carrito vacio"
            className="h-auto w-full max-w-[min(92vw,640px)] object-contain"
            priority
          />
          <Link
            href="/productos"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-6 py-3 text-sm font-bold text-[#003791] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#005BFF] hover:bg-[#EAF3FF] hover:text-[#005BFF]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Seguir comprando
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#D9E2EC] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase text-[#003791]">
              Carrito
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
              Tu carrito
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Revisa tus productos, ajusta cantidades y confirma el total antes de continuar.
            </p>
          </div>

          <div className="rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(0,55,145,0.08)]">
            <p className="text-xs font-bold uppercase text-slate-500">Unidades</p>
            <p className="mt-1 text-2xl font-extrabold text-[#003791]">{totalItems}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-white px-5 py-4 text-sm font-semibold text-red-700 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="grid gap-4">
            {items.map((item) => {
              const subtotal = getItemSubtotal(item);
              const hasImage = Boolean(item.imagenUrl) && !failedImageIds.includes(item.id);
              const isUpdating = pendingAction.endsWith(`-${item.id}`);
              const canIncrease = item.quantity < item.stock;

              return (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-[0_12px_30px_rgba(0,55,145,0.08)] sm:grid-cols-[120px_minmax(0,1fr)] sm:p-5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#D9E2EC] bg-[#F4F7FB] sm:aspect-square">
                    {hasImage ? (
                      <Image
                        src={item.imagenUrl ?? ""}
                        alt={item.nombre}
                        fill
                        sizes="(max-width: 640px) 100vw, 120px"
                        className="object-cover"
                        onError={() => markImageAsFailed(item.id)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAF3FF] to-[#F4F7FB] px-4 text-center">
                        <span className="rounded-full border border-[#D9E2EC] bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                          Sin imagen
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-lg font-extrabold text-[#111111]">
                        {item.nombre}
                      </h2>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          Precio: <span className="font-bold text-[#111111]">{formatPrice(item.precio)}</span>
                        </p>
                        <p>
                          Subtotal: <span className="font-bold text-[#003791]">{formatPrice(subtotal)}</span>
                        </p>
                        <p className="sm:col-span-2">Stock disponible: {item.stock}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <div className="inline-flex h-11 w-full overflow-hidden rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] sm:w-auto">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void runCartAction(`decrease-${item.id}`, () =>
                              updateQuantity(item.id, item.quantity - 1),
                            )
                          }
                          className="flex w-11 items-center justify-center text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:text-slate-400"
                          aria-label={`Disminuir cantidad de ${item.nombre}`}
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="flex min-w-12 flex-1 items-center justify-center border-x border-[#D9E2EC] bg-white px-3 text-sm font-bold text-[#111111] sm:flex-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating || !canIncrease}
                          onClick={() =>
                            void runCartAction(`increase-${item.id}`, () =>
                              updateQuantity(item.id, item.quantity + 1),
                            )
                          }
                          className="flex w-11 items-center justify-center text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:text-slate-400"
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          void runCartAction(`remove-${item.id}`, () => removeFromCart(item.id))
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-[0_16px_40px_rgba(0,55,145,0.10)] lg:sticky lg:top-28">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#003791]">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#111111]">Resumen</h2>
                <p className="text-sm text-slate-500">Totales del carrito</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-y border-[#D9E2EC] py-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-600">Unidades</span>
                <span className="font-bold text-[#111111]">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-600">Productos</span>
                <span className="font-bold text-[#111111]">{items.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-base font-bold text-[#111111]">Total</span>
                <span className="text-2xl font-extrabold text-[#003791]">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#003791] px-5 text-sm font-bold text-white shadow-[0_16px_35px_rgba(0,55,145,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Confirmar compra
            </button>

            <Link
              href="/productos"
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-5 text-sm font-bold text-[#003791] transition-all duration-300 hover:border-[#005BFF] hover:bg-[#EAF3FF] hover:text-[#005BFF]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Seguir comprando
            </Link>

            <button
              type="button"
              disabled={pendingAction === "clear"}
              onClick={() => void runCartAction("clear", clearCart)}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-[#F4F7FB] px-5 text-sm font-bold text-[#003791] transition-all duration-300 hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Limpiar carrito
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}





