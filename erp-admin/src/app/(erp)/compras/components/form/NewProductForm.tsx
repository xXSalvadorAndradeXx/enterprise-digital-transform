"use client";

import {
  VariantRow,
  type PurchaseVariantField,
  type PurchaseVariantValue,
} from "./VariantRow";

export type NewProductDraft = {
  name: string;
  category: string;
  variants: PurchaseVariantValue[];
};

type NewProductFormProps = {
  value: NewProductDraft;
  onChange: (value: NewProductDraft) => void;
};

function createVariant(id?: string): PurchaseVariantValue {
  const fallbackId = `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id:
      id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : fallbackId),
    size: "",
    quantity: "",
    unitCost: "",
  };
}

export function createInitialNewProductDraft(): NewProductDraft {
  return { name: "", category: "", variants: [createVariant("initial-variant")] };
}

export function NewProductForm({ value, onChange }: NewProductFormProps) {
  const updateVariant = (id: string, field: PurchaseVariantField, fieldValue: string) => {
    onChange({
      ...value,
      variants: value.variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: fieldValue } : variant,
      ),
    });
  };

  const addVariant = () => {
    onChange({ ...value, variants: [...value.variants, createVariant()] });
  };

  return (
    <section aria-labelledby="new-product-title">
      <h2 id="new-product-title" className="text-xl font-semibold text-[#202124]">
        Añadir Compra
      </h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,535px)_210px] lg:items-center lg:gap-12">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
          <label
            htmlFor="purchase-product-name"
            className="shrink-0 text-sm font-medium lg:w-[89px]"
          >
            Nombre del
            <br />
            producto:
          </label>
          <input
            id="purchase-product-name"
            type="text"
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            className="h-11 w-full min-w-0 rounded-[5px] border border-[#878A92] bg-white px-3 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1] lg:max-w-[430px]"
          />
        </div>

        <div className="min-w-0 lg:w-[210px]">
          <select
            id="purchase-category"
            aria-label="Categorías"
            value={value.category}
            onChange={(event) => onChange({ ...value, category: event.target.value })}
            className="h-9 w-full border-0 border-b border-[#B7BAC2] bg-white px-1 pr-8 text-sm outline-none focus:border-[#1C21D1] focus:ring-0"
          >
            <option value="">Categorías</option>
            {/* Datos temporales exclusivamente visuales para TASK 686. */}
            <option value="fashion">Moda</option>
            <option value="footwear">Calzado</option>
          </select>
        </div>
      </div>

      <fieldset className="mt-10">
        <legend className="mb-5 text-[15px] font-medium text-[#202124]">
          Ingreso de Stock por Talla
        </legend>
        <div>
          {value.variants.map((variant, index) => (
            <VariantRow
              key={variant.id}
              value={variant}
              onChange={updateVariant}
              onAdd={addVariant}
              showAddButton={index === value.variants.length - 1}
            />
          ))}
        </div>
      </fieldset>
    </section>
  );
}
