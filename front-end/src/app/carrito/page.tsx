"use client";

import { useRouter } from "next/navigation";

import { CartLine } from "@/components/cart/CartLine";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/cart/useCart";

export default function CartPage() {
  const router = useRouter();

  const {
    items,
    totalItems,
    subtotal,
    discountTotal,
    total,
    removeFromCart,
    updateQuantity,
    isSyncing,
    syncError,
  } = useCart();

  const handleRemove = async (
    itemId: string,
  ) => {
    await removeFromCart(itemId);
  };

  const handleUpdateQuantity = async (
    itemId: string,
    quantity: number,
  ) => {
    await updateQuantity(
      itemId,
      quantity,
    );
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8">
      {/* Estado de carga */}
      {isSyncing && items.length === 0 ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <p className="text-sm font-medium text-[#4b5563]">
            Cargando carrito...
          </p>
        </div>
      ) : syncError && items.length === 0 ? (
        /* Estado de error */
        <div
          role="alert"
          className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <p className="text-sm font-medium text-[#b91c1c]">
            {syncError}
          </p>
        </div>
      ) : items.length === 0 ? (
        /* Carrito vacío */
        <div className="flex w-full flex-col items-center justify-start pt-8 text-center">
          <img
            src="/images/cart-empty.svg"
            alt=""
            aria-hidden="true"
            className="mb-5 h-[180px] w-[180px] object-contain"
          />

          <h2 className="text-4xl font-bold text-black">
            Tu carrito está vacío
          </h2>

          <p className="mt-6 max-w-[700px] text-xl leading-9 text-[#555555]">
            Parece que aún no has agregado productos a tu carrito.
            <br />
            Explora nuestras categorías y encuentra artículos que te
            <br />
            encanten.
          </p>

          <button
            type="button"
            onClick={() => router.push("/productos")}
            className="mt-8 h-12 rounded-sm bg-[#2222e7] px-8 text-base font-semibold text-white transition hover:bg-[#1919c7]"
          >
            Comenzar a comprar
          </button>
        </div>
      ) : (
        /* Carrito con productos */
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          {/* Columna izquierda */}
          <div className="min-w-0">
            {/* Título */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold text-[#111827]">
                Carrito de compras
              </h1>
            </div>

            <section
              aria-label="Productos del carrito"
              className="w-full"
            >
              {/* Encabezados de escritorio */}
              <div className="hidden grid-cols-[1fr_150px_130px] items-center gap-6 border-b border-black pb-3 sm:grid">
                <div>
                  <span className="pl-[85px] text-base font-semibold text-[#4b4b4b]">
                    Detalle
                  </span>
                </div>

                <div className="flex justify-center">
                  <span className="text-base font-semibold text-[#4b4b4b]">
                    Cantidad
                  </span>
                </div>

                <div className="flex justify-center">
                  <span className="text-base font-semibold text-[#4b4b4b]">
                    Total
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-4 sm:space-y-0">
                {items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onUpdateQuantity={
                      handleUpdateQuantity
                    }
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Resumen de compra */}
          <CartSummary
            subtotal={subtotal}
            discountTotal={discountTotal}
            preliminaryTotal={total}
            totalItems={totalItems}
          />
        </div>
      )}
    </main>
  );
}