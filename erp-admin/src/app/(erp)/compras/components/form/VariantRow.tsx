"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";

export type PurchaseVariantField = "size" | "quantity" | "unitCost";

export interface PurchaseVariantValue {
  id: string;
  size: string;
  quantity: string;
  unitCost: string;
}

export interface PurchaseVariantErrors {
  size?: string;
  quantity?: string;
  unitCost?: string;
}

export interface VariantRowProps {
  value: PurchaseVariantValue;
  index: number;
  onChange: (id: string, field: PurchaseVariantField, value: string) => void;
  onAdd: () => void;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
  showAddButton?: boolean;
  disabled?: boolean;
  errors?: PurchaseVariantErrors;
  className?: string;
}

const fields: Array<{
  name: PurchaseVariantField;
  label: string;
  type: "text" | "number";
  min?: number;
  step?: number;
}> = [
  { name: "size", label: "Talla", type: "text" },
  { name: "quantity", label: "Cantidad", type: "number", min: 0, step: 1 },
  { name: "unitCost", label: "Costo Unitario", type: "number", min: 0, step: 0.01 },
];

export function VariantRow({
  value,
  index,
  onChange,
  onAdd,
  onRemove,
  canRemove = false,
  showAddButton = false,
  disabled = false,
  errors,
  className = "",
}: VariantRowProps) {
  const generatedId = useId();

  return (
    <div
      className={`grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] ${className}`}
    >
      {fields.map((field) => {
        const inputId = `${generatedId}-${field.name}`;
        const error = errors?.[field.name];
        const errorId = `${inputId}-error`;

        return (
          <div key={field.name} className="min-w-0">
            <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-[#4A4A4A]">
              {field.label}
            </label>
            <input
              id={inputId}
              type={field.type}
              value={value[field.name]}
              min={field.min}
              step={field.step}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onChange(value.id, field.name, event.target.value)}
              className="h-10 w-full min-w-0 rounded-[5px] border border-[#878A92] bg-white px-3 text-sm text-[#202124] outline-none disabled:cursor-not-allowed disabled:bg-[#F7F7F8] disabled:opacity-60 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
            />
            {error && (
              <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex min-h-16 items-center gap-1 pt-4 sm:justify-end">
        {canRemove && onRemove && (
          <button
            type="button"
            aria-label={`Eliminar talla ${index + 1}`}
            disabled={disabled}
            onClick={() => onRemove(value.id)}
            className="flex size-9 items-center justify-center text-red-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
          </button>
        )}

        {showAddButton && (
          <button
            type="button"
            aria-label="Agregar otra talla"
            disabled={disabled}
            onClick={onAdd}
            className="flex size-9 items-center justify-center rounded-full border border-[#202124] bg-white text-[#202124] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
          >
            <Plus aria-hidden="true" size={20} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
