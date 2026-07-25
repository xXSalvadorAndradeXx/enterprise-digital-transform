"use client";

export type RestockSize = {
  size: string;
  currentStock: number;
  quantity: string;
};

type RestockTableProps = {
  rows: RestockSize[];
  onQuantityChange: (size: string, quantity: string) => void;
  errors?: Record<string, string | undefined>;
};

export function RestockTable({ rows, onQuantityChange, errors }: RestockTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <h3 className="mb-3 text-base font-medium text-[#202124]">
        Reabastecimiento de Stock por Talla
      </h3>
      <table className="w-full min-w-[520px] table-fixed border-collapse text-center text-sm">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[30%]" />
          <col className="w-[48%]" />
        </colgroup>
        <thead className="bg-[#E7F0FF] text-[#202124]">
          <tr>
            <th scope="col" className="border-b border-[#C8D8EF] px-3 py-2.5 font-semibold">Talla</th>
            <th scope="col" className="border-b border-[#C8D8EF] px-3 py-2.5 font-semibold">Existencia Actual</th>
            <th scope="col" className="border-b border-[#C8D8EF] px-3 py-2.5 font-semibold">Cantidad a Reabastecer</th>
          </tr>
        </thead>
        <tbody className="bg-[#F5F7FA]">
          {rows.map((row) => (
            <tr key={row.size} className="border-b border-[#E1E4E9] last:border-b-0">
              <th scope="row" className="px-3 py-2.5 font-medium">{row.size}</th>
              <td className="px-3 py-2.5">{row.currentStock}</td>
              <td className="px-3 py-2.5">
                <label className="sr-only" htmlFor={`restock-${row.size}`}>
                  Cantidad a reabastecer para talla {row.size}
                </label>
                <input
                  id={`restock-${row.size}`}
                  type="number"
                  min={0}
                  step={1}
                  value={row.quantity}
                  aria-invalid={errors?.[row.size] ? true : undefined}
                  aria-describedby={
                    errors?.[row.size] ? `restock-${row.size}-error` : undefined
                  }
                  onChange={(event) => onQuantityChange(row.size, event.target.value)}
                  className="mx-auto block h-7 w-[100px] rounded-[4px] border border-[#AEB1B8] bg-white px-2 text-center outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
                />
                {errors?.[row.size] && (
                  <p
                    id={`restock-${row.size}-error`}
                    role="alert"
                    className="mt-1 text-xs text-red-600"
                  >
                    {errors[row.size]}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
