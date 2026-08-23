"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, X } from "lucide-react";

import type { CartItem } from "@/contexts/CartContext";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  onRemove: (itemId: string) => Promise<void>;
}

export function MiniCart({
  isOpen,
  onClose,
  items,
  totalItems,
  subtotal,
  onRemove,
}: MiniCartProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOpenFullCart = () => {
    onClose();
    router.push("/carrito");
  };

  const handleRemove = async (itemId: string) => {
    await onRemove(itemId);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white px-7 py-5 shadow-2xl"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-2">
            <h2
              id="mini-cart-title"
              className="text-sm font-semibold text-[#111827]"
            >
              Carro de compras
            </h2>

            <span className="text-xs text-[#6b7280]">
              ({totalItems})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="rounded p-1 text-[#ff8e8e] transition hover:bg-[#fff1f1]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart
                className="mb-4 h-10 w-10 text-[#b5bac5]"
                aria-hidden="true"
              />

              <p className="text-base font-semibold text-[#111827]">
                Tu carrito está vacío
              </p>

              <p className="mt-2 max-w-[250px] text-sm leading-5 text-[#6b7280]">
                Aún no has agregado productos a tu carrito.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-sm font-semibold text-[#2222e7] underline underline-offset-2"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-3 border-b border-black py-4"
                >
                  {/* Imagen */}
                  <div className="h-[100px] w-[110px] shrink-0 overflow-hidden bg-[#f7f7f7]">
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.nombre}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingCart
                          className="h-7 w-7 text-[#9ca3af]"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="line-clamp-2 text-sm font-medium text-[#111827]">
                      {item.nombre}
                    </p>

                    <p className="mt-1 text-sm text-[#111827]">
                      ${item.precio.toFixed(2)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                      <div className="flex items-center gap-1">
                        <span>Color:</span>

                        <span
                          className="h-3 w-3 rounded-full border border-[#9ca3af]"
                          style={{
                            backgroundColor: item.colorHex,
                          }}
                          aria-hidden="true"
                        />

                        <span>{item.color}</span>
                      </div>

                      <span aria-hidden="true">—</span>

                      <span>Talla: {item.talla}</span>
                    </div>

                    <p className="mt-2 text-xs text-[#6b7280]">
                      Cantidad: {item.quantity}
                    </p>
                  </div>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.id)}
                    aria-label={`Eliminar ${item.nombre} del carrito`}
                    className="self-end rounded p-1 text-[#374151] transition hover:bg-[#f3f4f6] hover:text-[#ef4444]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black pt-5">
          {/* Contenedor alineado */}
          <div className="px-5">
            {/* Subtotal */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#111827]">
                Sub Total
              </span>

              <span className="text-sm font-semibold text-[#111827]">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {/* Comprar pedido */}
            <button
              type="button"
              disabled={items.length === 0}
              aria-disabled={items.length === 0}
              className="
                h-11 w-full rounded-sm
                bg-[#2222e7]
                text-sm font-semibold text-white
                transition
                hover:bg-[#1919c7]
                disabled:cursor-not-allowed
                disabled:bg-[#a8a8ee]
                disabled:text-white
                disabled:hover:bg-[#a8a8ee]
              "
            >
              Comprar pedido
            </button>

            {/* Ver carrito */}
            <button
              type="button"
              onClick={handleOpenFullCart}
              className="mt-4 w-full text-center text-sm font-semibold text-[#111827] underline underline-offset-2"
            >
              Ver carrito
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}