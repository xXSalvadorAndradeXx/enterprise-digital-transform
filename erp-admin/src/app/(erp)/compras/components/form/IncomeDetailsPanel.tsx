"use client";

import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AddedProduct } from "./AddedProductsTable";
import type { PurchaseVariantField, PurchaseVariantValue } from "./VariantRow";
import { ColorHexInput } from "./ColorHexInput";

type IncomeDetailsPanelProps = {
  product: AddedProduct;
  onClose: () => void;
  onSave: (variants: PurchaseVariantValue[]) => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function IncomeDetailsPanel({
  product,
  onClose,
  onSave,
}: IncomeDetailsPanelProps) {
  const [variants, setVariants] = useState<PurchaseVariantValue[]>(() =>
    product.variants.map((variant) => ({ ...variant })),
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => firstInputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [product, onClose]);

  const updateVariant = (
    id: string,
    field: PurchaseVariantField,
    value: string,
  ) => {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const stockTotal = variants.reduce((sum, variant) => {
    const quantity = Number(variant.quantity);
    return Number.isFinite(quantity) && quantity >= 0 ? sum + quantity : sum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="income-details-title"
        aria-describedby="income-details-product"
        className="relative w-full max-w-[760px] rounded-[8px] bg-[#F5F7FA] px-5 py-5 shadow-xl"
      >
        <button
          type="button"
          aria-label="Cerrar detalles de ingreso"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-[#4A4A4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <h2 id="income-details-title" className="pr-10 text-xl font-semibold">
          Detalles de Ingreso
        </h2>
        <p id="income-details-product" className="mt-1 text-sm text-[#4A4A4A]">
          {product.name}
        </p>

        <div className="mx-auto mt-4 w-full space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="grid grid-cols-1 items-center gap-y-3 lg:grid-cols-[minmax(130px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)_minmax(190px,1fr)_32px] lg:gap-x-5"
            >
              {(["size", "color", "quantity", "unitCost"] as const).map((field) => (
                <label
                  key={field}
                  className="flex min-w-0 flex-col gap-1 text-xs font-medium text-[#4A4A4A] sm:flex-row sm:items-center sm:gap-2"
                >
                  {field === "size"
                    ? "Talla"
                    : field === "color"
                      ? "Color"
                    : field === "quantity"
                      ? "Cantidad"
                      : "Costo Unitario"}
                  {field === "color" ? (
                    <ColorHexInput
                      value={variant.color}
                      ariaLabel={`Color de variante ${index + 1}`}
                      onChange={(color) => updateVariant(variant.id, "color", color)}
                      className="w-full lg:w-[118px]"
                    />
                  ) : (
                    <input
                      ref={index === 0 && field === "size" ? firstInputRef : undefined}
                      type="text"
                      value={variant[field]}
                      onChange={(event) =>
                        updateVariant(variant.id, field, event.target.value)
                      }
                      className={`h-8 w-full rounded-[4px] border border-[#878A92] bg-white px-2 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1] ${
                        field === "unitCost" ? "lg:w-[84px]" : "lg:w-[70px]"
                      }`}
                    />
                  )}
                </label>
              ))}
              <button
                type="button"
                aria-label={`Eliminar variante ${index + 1} de ${product.name}`}
                disabled={variants.length === 1}
                onClick={() =>
                  setVariants((current) =>
                    current.length > 1
                      ? current.filter((item) => item.id !== variant.id)
                      : current,
                  )
                }
                className="mb-0.5 inline-flex size-8 items-center justify-center rounded text-red-600 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-semibold">STOCK TOTAL</p>
          <output aria-label="Stock total" className="mt-1 block text-lg font-bold">
            {stockTotal}
          </output>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onSave(variants.map((variant) => ({ ...variant })))}
            className="h-9 rounded-[5px] bg-[#1C21D1] px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
