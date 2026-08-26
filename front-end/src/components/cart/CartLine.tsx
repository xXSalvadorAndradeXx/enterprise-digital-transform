"use client";

import {
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";

import type { CartItem } from "@/contexts/CartContext";
import Image from "next/image";

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
    <>
      {/* MÓVIL */}
      <article className="rounded-lg border border-[#e5e7eb] bg-white p-4 sm:hidden">
        <div className="flex gap-4">
          {/* Imagen */}
          <div className="flex h-[95px] w-[95px] shrink-0 items-center justify-center overflow-hidden bg-[#f7f7f7]">
            {item.imagenUrl ? (
              <Image
                src={item.imagenUrl}
                alt={item.nombre}
                className="h-full w-full object-contain"
                width={95}
                height={95}
                unoptimized
              />
            ) : (
              <ShoppingCart
                className="h-7 w-7 text-[#9ca3af]"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Información */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-[#111827]">
              {item.nombre}
            </p>

            <p className="mt-1 text-sm font-medium text-[#111827]">
              ${item.precio.toFixed(2)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[#4b5563]">
              <div className="flex items-center gap-1">
                <span>Color:</span>

                <span
                  className="h-3 w-3 rounded-full border border-black"
                  style={{
                    backgroundColor: item.colorHex,
                  }}
                  aria-hidden="true"
                />

                <span>{item.color}</span>
              </div>

              <span aria-hidden="true">—</span>

              <span>
                Talla: {item.talla}
              </span>
            </div>
          </div>
        </div>

        {/* Cantidad + total */}
        <div className="mt-5 flex items-center justify-between border-t border-[#e5e7eb] pt-4">
          {/* Cantidad */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#4b5563]">
              Cantidad
            </p>

            <div className="flex h-9 items-center rounded-md border border-[#e1e5ed] bg-[#f8f9fb]">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={!canDecrease}
                aria-label={`Disminuir cantidad de ${item.nombre}`}
                className="flex h-full w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>

              <span className="min-w-8 text-center text-sm font-medium text-[#111827]">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                disabled={!canIncrease}
                aria-label={`Aumentar cantidad de ${item.nombre}`}
                className="flex h-full w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="mb-2 text-xs font-medium text-[#4b5563]">
              Total
            </p>

            <div className="flex items-center gap-3">
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
          </div>
        </div>
      </article>

      {/* ESCRITORIO */}
      <article className="hidden grid-cols-[1fr_150px_130px] items-center gap-6 py-5 sm:grid">
        {/* Detalle */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Imagen */}
          <div className="flex h-[80px] w-[90px] shrink-0 items-center justify-center overflow-hidden bg-[#f7f7f7]">
            {item.imagenUrl ? (
              <Image
                src={item.imagenUrl}
                alt={item.nombre}
                className="h-full w-full object-contain"
                width={90}
                height={80}
                unoptimized
              />
            ) : (
              <ShoppingCart
                className="h-7 w-7 text-[#9ca3af]"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Información */}
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium text-[#111827]">
              {item.nombre}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[#4b5563]">
              <div className="flex items-center gap-1">
                <span>Color:</span>

                <span
                  className="h-3 w-3 rounded-full border border-black"
                  style={{
                    backgroundColor: item.colorHex,
                  }}
                  aria-hidden="true"
                />

                <span>{item.color}</span>
              </div>

              <span aria-hidden="true">—</span>

              <span>
                Talla: {item.talla}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-[#111827]">
              ${item.precio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Cantidad */}
        <div className="flex items-center justify-center">
          <div className="flex h-9 items-center rounded-md border border-[#e1e5ed] bg-[#f8f9fb]">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={!canDecrease}
              aria-label={`Disminuir cantidad de ${item.nombre}`}
              className="flex h-full w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </button>

            <span className="min-w-8 text-center text-sm font-medium text-[#111827]">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={!canIncrease}
              aria-label={`Aumentar cantidad de ${item.nombre}`}
              className="flex h-full w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Total + eliminar */}
        <div className="flex items-center justify-center gap-4">
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
    </>
  );
}
