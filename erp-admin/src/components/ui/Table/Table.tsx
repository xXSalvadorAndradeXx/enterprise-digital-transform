"use client";

import { ArrowUpDown, Check } from "lucide-react";
import { TableProps } from "./Table.types";

import { SelectionCounter } from "@/components/ui/SelectionCounter";

function alignClass(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function Table<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedRows,
  onSelectionChange,
  actions,
  bulkActions,
  sortConfig,
  onSortChange,
  isLoading = false,
  emptyMessage = "No hay registros para mostrar.",
}: TableProps<T>) {
  const selected = selectedRows ?? new Set<string | number>();
  const selectedCount = selected.size;
  const allIds = data.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(allIds));
  };

  const toggleRow = (id: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const clearSelection = () => onSelectionChange?.(new Set());

  const colSpan = columns.length + (selectable ? 1 : 0) + (actions?.length ? 1 : 0);

  return (
    <div className="w-full">
      {/**/}
{selectable && (
  <div className="flex items-center justify-between border-b border-gray-200 bg-indigo-50/60 px-4 py-3">
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={allSelected}
        onClick={toggleAll}
        className="flex h-5 w-5 items-center justify-center rounded border-2 border-indigo-600 bg-white text-indigo-600"
      >
        {allSelected && (
          <Check size={14} strokeWidth={3} />
        )}
      </button>

      <SelectionCounter count={selectedCount} />
    </div>

    <div className="flex items-center gap-2">
      {bulkActions?.(
        selectedCount,
        clearSelection,
      )}
    </div>
  </div>
)}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-800">
              {selectable && <th className="w-10 px-4 py-3" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium ${alignClass(column.align)}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      {column.header}
                      <ArrowUpDown
                        size={14}
                        className={sortConfig?.key === column.key ? "text-indigo-600" : "text-gray-400"}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && <th className="px-4 py-3 text-center font-medium">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = rowKey(row);
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={id}
                    className="border-b border-gray-100 text-gray-700 last:border-0 hover:bg-gray-50/60"
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          onClick={() => toggleRow(id)}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                            isSelected ? "border-indigo-600 bg-white text-indigo-600" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 ${alignClass(column.align)}`}>
                        {column.accessor(row)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          {actions
                            .filter((action) => !action.show || action.show(row))
                            .map((action) => (
                              <button
                                key={action.label}
                                type="button"
                                title={action.label}
                                onClick={() => action.onClick(row)}
                                className={action.className ?? "text-[#1C21D1] hover:text-indigo-400"}
                              >
                                <action.icon size={18} />
                              </button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}