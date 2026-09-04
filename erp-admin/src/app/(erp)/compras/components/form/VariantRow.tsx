"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";

import { ColorHexInput } from "./ColorHexInput";

export type PurchaseVariantField = "size" | "quantity" | "unitCost" | "color";

export interface PurchaseVariantValue {
  id: string;
  size: string;
  quantity: string;
  unitCost: string;
  color: string;
}

export interface PurchaseVariantErrors {
  size?: string;
  quantity?: string;
  unitCost?: string;
  color?: string;
}

export interface VariantRowProps {
  value: PurchaseVariantValue;
  onChange: (id: string, field: PurchaseVariantField, value: string) => void;
  onAdd: () => void;
  onRemove?: (id: string) => void;
  showAddButton?: boolean;
  disabled?: boolean;
  errors?: PurchaseVariantErrors;
  className?: string;
}

const fields: Array<{
  name: PurchaseVariantField;
  label: string;
  inputWidth: string;
}> = [
  { name: "size", label: "Talla:", inputWidth: "sm:w-[88px]" },
  { name: "quantity", label: "Cantidad:", inputWidth: "sm:w-[88px]" },
  { name: "unitCost", label: "Costo Unitario:", inputWidth: "sm:w-[104px]" },
  { name: "color", label: "Color:", inputWidth: "sm:w-[152px]" },
];

export function VariantRow({
  value,
  onChange,
  onAdd,
  onRemove,
  showAddButton = false,
  disabled = false,
  errors,
  className = "",
}: VariantRowProps) {
  const generatedId = useId();

  return (
    <div
      className={`grid grid-cols-1 items-start gap-y-3 md:grid-cols-2 md:gap-x-6 xl:grid-cols-[130px_150px_200px_160px] xl:gap-x-6 ${className}`}
    >
      {fields.map((field) => {
        const inputId = `${generatedId}-${field.name}`;
        const error = errors?.[field.name];
        const errorId = `${inputId}-error`;

        return (
          <div key={field.name} className="min-w-0">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor={inputId} className="shrink-0 text-sm font-medium text-[#4A4A4A]">
                {field.label}
              </label>
              {field.name === "color" ? (
                <ColorHexInput
                  value={value.color}
                  disabled={disabled}
                  ariaLabel="Color de la variante"
                  onChange={(color) => onChange(value.id, "color", color)}
                  className={`w-full ${field.inputWidth}`}
                />
              ) : (
                <input
                  id={inputId}
                  type="text"
                  value={value[field.name]}
                  disabled={disabled}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => onChange(value.id, field.name, event.target.value)}
                  className={`h-8 w-full min-w-0 rounded-[4px] border border-[#878A92] bg-white px-2 text-sm text-[#202124] outline-none disabled:cursor-not-allowed disabled:bg-[#F7F7F8] disabled:opacity-60 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1] ${field.inputWidth}`}
                />
              )}
            </div>
            <div className="min-h-10 pt-1">
              {error && (
                <p id={errorId} role="alert" className="text-xs leading-4 text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {showAddButton && (
        <button
          type="button"
          aria-label="Agregar otra talla"
          disabled={disabled}
          onClick={onAdd}
          className="flex size-7 items-center justify-center rounded-full border border-[#1C21D1] bg-white text-[#1C21D1] disabled:cursor-not-allowed disabled:opacity-50 xl:col-start-1"
        >
          <Plus aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Eliminar talla ${value.size || "sin nombre"}`}
          disabled={disabled}
          onClick={() => onRemove(value.id)}
          className="flex size-7 items-center justify-center rounded text-red-600 disabled:cursor-not-allowed disabled:opacity-50 xl:col-start-2 xl:row-start-2"
        >
          <Trash2 aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  );
}
