"use client";

import { Minus, Plus, ShoppingCart, X } from "lucide-react";

import type { CartItem } from "@/contexts/CartContext";

interface CartLineProps {
  item: CartItem;
  onRemove: (itemId: string) => Promise<void>;
  onUpdateQuantity: (
    itemId: string,
    quantity: number,
  ) => Promise<void>;
}

export function CartLine({
  item,
  onRemove,
  onUpdateQuantity,
}: CartLineProps) {
  const canDecrease = item.quantity > 1;
  const canIncrease = item.quantity < item.stock;

  const handleDecrease = () => {
    if (!canDecrease) return;

    void onUpdateQuantity(
      item.id,
      item.quantity - 1,
    );
  };

  const handleIncrease = () => {
    if (!canIncrease) return;

    void onUpdateQuantity(
      item.id,
      item.quantity + 1,
    );
  };

  const handleRemove = () => {
    void onRemove(item.id);
  };

  return (
    <article className="grid grid-cols-1 gap-4 border-b border-[#d1d5db] py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
      {/* Detalle */}
      <div className="flex min-w-0 items-center gap-4">
        {/* Imagen */}
        <div className="flex h-[80px] w-[90px] shrink-0 items-center justify-center overflow-hidden bg-[#f7f7f7]">
          {item.imagenUrl ? (
            <img
              src={item.imagenUrl}
              alt={item.nombre}
              className="h-full w-full object-contain"
            />
          ) : (
            <ShoppingCart
              className="h-7 w-7 text-[#9ca3af]"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Información del producto */}
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-[#111827]">
            {item.nombre}
          </p>

          {/* Variante */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6b7280]">
            <div className="flex items-center gap-1.5">
              <span>Color:</span>

              <span
                className="h-3 w-3 rounded-full border border-[#d1d5db]"
                style={{
                  backgroundColor: item.colorHex,
                }}
                aria-hidden="true"
              />

              <span>{item.color}</span>
            </div>

            <span
              className="text-[#9ca3af]"
              aria-hidden="true"
            >
              —
            </span>

            <span>
              Talla: {item.talla}
            </span>
          </div>

          {/* Precio unitario */}
          <p className="mt-2 text-sm font-medium text-[#111827]">
            ${item.precio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Cantidad */}
      <div className="flex items-center sm:justify-center">
        <div className="flex h-9 items-center rounded-md border border-[#e1e5ed] bg-[#f8f9fb]">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={!canDecrease}
            aria-label={`Disminuir cantidad de ${item.nombre}`}
            className="flex h-full w-9 items-center justify-center rounded-l-md transition hover:bg-[#eef0f5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>

          <span
            className="min-w-8 text-center text-sm font-medium text-[#111827]"
            aria-label={`Cantidad: ${item.quantity}`}
          >
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={!canIncrease}
            aria-label={`Aumentar cantidad de ${item.nombre}`}
            className="flex h-full w-9 items-center justify-center rounded-r-md transition hover:bg-[#eef0f5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Total de línea + eliminar */}
      <div className="flex items-center justify-between gap-4 sm:min-w-[110px] sm:justify-end">
        <span className="text-sm font-semibold text-[#111827]">
          ${item.totalLinea.toFixed(2)}
        </span>

        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Eliminar ${item.nombre} del carrito`}
          className="rounded p-1 text-[#ff5252] transition hover:bg-[#fff1f1]"
        >
          <X
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}