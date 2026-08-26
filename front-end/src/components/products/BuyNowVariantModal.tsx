"use client";

import { Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProductVariant } from "@/types/products/product.types";

interface BuyNowVariantModalProps {
  productName: string;
  variants: ProductVariant[];
  onClose: () => void;
  onConfirm: (variant: ProductVariant, quantity: number) => void;
}

export default function BuyNowVariantModal({
  productName,
  variants,
  onClose,
  onConfirm,
}: BuyNowVariantModalProps) {
  const availableVariants = useMemo(
    () => variants.filter((variant) => variant.available && variant.stock > 0),
    [variants],
  );
  const colors = useMemo(
    () =>
      Array.from(
        new Map(
          availableVariants.map((variant) => [variant.color.hex, variant.color]),
        ).values(),
      ),
    [availableVariants],
  );
  const [colorHex, setColorHex] = useState(colors[0]?.hex ?? "");
  const sizes = availableVariants.filter(
    (variant) => variant.color.hex === colorHex,
  );
  const [variantId, setVariantId] = useState(sizes[0]?.id ?? "");
  const selectedVariant = availableVariants.find(
    (variant) => variant.id === variantId,
  );
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const firstForColor = availableVariants.find(
      (variant) => variant.color.hex === colorHex,
    );
    setVariantId(firstForColor?.id ?? "");
    setQuantity(1);
  }, [colorHex, availableVariants]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-now-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="buy-now-title" className="text-xl font-bold text-slate-950">
              Elige tu producto
            </h2>
            <p className="mt-1 text-sm text-slate-500">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selección"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {colors.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold">
              Color
              <span className="ml-2 font-normal text-slate-500">
                {selectedVariant?.color.name}
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color.hex}
                  title={color.name}
                  aria-label={`Seleccionar color ${color.name}`}
                  onClick={() => setColorHex(color.hex)}
                  className={`h-9 w-9 rounded-full border-2 ${
                    colorHex === color.hex
                      ? "border-[#1822d9] ring-2 ring-blue-100"
                      : "border-slate-300"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">Talla</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((variant) => (
              <button
                type="button"
                key={variant.id}
                onClick={() => {
                  setVariantId(variant.id);
                  setQuantity(1);
                }}
                className={`min-w-12 rounded-md border px-3 py-2 text-sm font-medium ${
                  variantId === variant.id
                    ? "border-[#1822d9] bg-[#1822d9] text-white"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">Cantidad</p>
          <div className="inline-flex h-11 items-center overflow-hidden rounded-md border border-slate-300 bg-slate-50">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Disminuir cantidad"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-10 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              disabled={!selectedVariant || quantity >= selectedVariant.stock}
              onClick={() =>
                setQuantity((value) =>
                  Math.min(selectedVariant?.stock ?? 1, value + 1),
                )
              }
              aria-label="Aumentar cantidad"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {selectedVariant && (
            <p className="mt-2 text-xs text-slate-500">
              Máximo {selectedVariant.stock} unidades
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!selectedVariant}
          onClick={() => selectedVariant && onConfirm(selectedVariant, quantity)}
          className="mt-7 h-12 w-full rounded-lg bg-[#1822d9] font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Ir a comprar
        </button>
      </section>
    </div>
  );
}
