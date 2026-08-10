"use client";

import { Trash2 } from "lucide-react";

import { ColorHexInput } from "./ColorHexInput";

export type RestockSize = {
  id: string;
  size: string;
  color: string;
  currentStock: number;
  quantity: string;
  unitCost: string;
  isNew?: boolean;
};

type EditableRestockField = "size" | "color" | "quantity" | "unitCost";

type RestockTableProps = {
  rows: RestockSize[];
  onChange: (id: string, field: EditableRestockField, value: string) => void;
  onRemoveNew: (id: string) => void;
  errors?: Record<string, string | undefined>;
};

export function RestockTable({ rows, onChange, onRemoveNew, errors }: RestockTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <h3 className="mb-3 text-base font-medium text-[#202124]">
        Reabastecimiento de stock por talla
      </h3>
      <table className="w-full min-w-[760px] table-fixed border-collapse text-center text-sm">
        <colgroup>
          <col className="w-[15%]" />
          <col className="w-[17%]" />
          <col className="w-[20%]" />
          <col className="w-[24%]" />
          <col className="w-[20%]" />
          <col className="w-[4%]" />
        </colgroup>
        <thead className="bg-[#CFE0FA] text-[#202124]">
          <tr>
            {['Talla', 'Color', 'Existencia actual', 'Cantidad a reabastecer', 'Costo unitario', ''].map((label) => (
              <th key={label || 'actions'} scope="col" className="border-b border-[#B8CBEA] px-3 py-2.5 font-semibold">
                {label || <span className="sr-only">Acciones</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#F7F7F8]">
          {rows.map((row) => {
            const errorId = `restock-${row.id}-error`;
            return (
              <tr key={row.id} className="border-b border-white last:border-b-0">
                <td className="px-3 py-2.5">
                  {row.isNew ? (
                    <input aria-label="Nueva talla" value={row.size} onChange={(event) => onChange(row.id, 'size', event.target.value)} className="h-8 w-full rounded border border-[#AEB1B8] bg-white px-2 text-center outline-none focus:border-[#1C21D1]" />
                  ) : row.size}
                </td>
                <td className="px-3 py-2.5">
                  {row.isNew ? (
                    <ColorHexInput ariaLabel="Color de la nueva talla" value={row.color} onChange={(color) => onChange(row.id, "color", color)} className="mx-auto w-full max-w-[132px]" />
                  ) : (
                    <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-4 rounded-full border border-black/15" style={{ backgroundColor: row.color }} />{row.color}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">{row.isNew ? 'Nueva' : row.currentStock}</td>
                <td className="px-3 py-2.5">
                  <input aria-label={`Cantidad a reabastecer para talla ${row.size || 'nueva'}`} type="number" min={0} step={1} value={row.quantity} aria-invalid={errors?.[row.id] ? true : undefined} aria-describedby={errors?.[row.id] ? errorId : undefined} onChange={(event) => onChange(row.id, 'quantity', event.target.value)} className="mx-auto block h-8 w-[100px] rounded border border-[#AEB1B8] bg-white px-2 text-center outline-none focus:border-[#1C21D1]" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="mx-auto flex w-[110px] items-center gap-2"><span>$</span><input aria-label={`Costo unitario para talla ${row.size || 'nueva'}`} type="number" min={0} step="0.01" value={row.unitCost} onChange={(event) => onChange(row.id, 'unitCost', event.target.value)} className="h-8 w-[86px] rounded border border-[#AEB1B8] bg-white px-2 text-center outline-none focus:border-[#1C21D1]" /></div>
                  {errors?.[row.id] && <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{errors[row.id]}</p>}
                </td>
                <td className="px-2 py-2.5">{row.isNew && <button type="button" aria-label="Eliminar nueva talla" onClick={() => onRemoveNew(row.id)} className="inline-flex size-8 items-center justify-center rounded text-red-600 focus-visible:outline-2 focus-visible:outline-red-600"><Trash2 aria-hidden="true" size={17} /></button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
