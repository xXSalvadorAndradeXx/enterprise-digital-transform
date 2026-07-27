"use client";

import { Pencil, Trash2 } from "lucide-react";
import { TableProps } from "./Table.types";

const Table = ({
  columns,
  data,
  className = "",
  footer,
  showBorder = true,
}: TableProps) => {
  return (
    <div
      className={`
        w-full
        overflow-hidden
        bg-white
        ${
          showBorder
            ? "rounded-lg border border-[#D9D9D9]"
            : ""
        }
        ${className}
      `}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F2F3FF]">
            {columns.map((column) => (
              <th
                key={column.accessor}
                style={{ width: column.width }}
                className="
                  border-b
                  border-[#D9D9D9]
                  px-6
                  py-3
                  text-left
                  text-[13px]
                  font-medium
                  text-[#374151]
                "
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-sm text-gray-500"
              >
                No hay datos disponibles.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="
                  border-b
                  border-[#E5E7EB]
                  hover:bg-[#FAFAFA]
                  transition-colors
                "
              >
                {columns.map((column) => {
                  const value = row[column.accessor];

                  return (
                    <td
                      key={column.accessor}
                      style={{ width: column.width }}
                      className="
                        px-7
                        py-3
                        text-[13px]
                        text-[#374151]
                        align-middle
                      "
                    >
                      {column.render ? (
                        column.render(value, row)
                      ) : column.accessor === "actions" ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="
                              flex
                              h-6
                              w-6
                              items-center
                              justify-center
                              rounded
                              border
                              border-[#D1D5DB]
                              bg-white
                              transition-colors
                              hover:bg-gray-100
                            "
                          >
                            <Pencil
                              size={13}
                              strokeWidth={2}
                              className="text-black"
                            />
                          </button>

                          <button
                            type="button"
                            className="
                              flex
                              h-6
                              w-6
                              items-center
                              justify-center
                              rounded
                              border
                              border-[#D1D5DB]
                              bg-white
                              transition-colors
                              hover:bg-red-50
                            "
                          >
                            <Trash2
                              size={13}
                              strokeWidth={2}
                              className="text-[#FF3B30]"
                            />
                          </button>
                        </div>
                      ) : (
                        String(value ?? "")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {footer && (
        <div
          className="
            flex
            justify-end
            border-t
            border-[#E5E7EB]
            px-6
            py-3
          "
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Table;