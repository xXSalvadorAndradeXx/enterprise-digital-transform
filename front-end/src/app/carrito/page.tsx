"use client";

import { ShoppingCart } from "lucide-react";

import { CartLine } from "@/components/cart/CartLine";
import { useCart } from "@/hooks/cart/useCart";

export default function CartPage() {
  const {
    items,
    totalItems,
    removeFromCart,
    updateQuantity,
    isSyncing,
    syncError,
  } = useCart();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827]">
          Carro de compras
        </h1>

        <p className="mt-1 text-sm text-[#6b7280]">
          {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </p>
      </div>

      {isSyncing && items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#6b7280]">
            Cargando carrito...
          </p>
        </div>
      ) : syncError && items.length === 0 ? (
        <div
          role="alert"
          className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <p className="text-sm text-[#b91c1c]">
            {syncError}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
          <ShoppingCart
            className="mb-4 h-10 w-10 text-[#b5bac5]"
            aria-hidden="true"
          />

          <p className="text-base font-semibold text-[#111827]">
            Tu carrito está vacío
          </p>

          <p className="mt-2 text-sm text-[#6b7280]">
            Aún no has agregado productos a tu carrito.
          </p>
        </div>
      ) : (
        <section aria-label="Productos del carrito">
          {items.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </section>
      )}
    </main>
  );
}