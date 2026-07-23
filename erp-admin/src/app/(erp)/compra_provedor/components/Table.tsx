import type { ReactNode } from "react";

export type TableColumnAlignment = "left" | "center" | "right";

export interface TableColumn<T> {
  id: string;
  header: ReactNode;
  className?: string;
  align?: TableColumnAlignment;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  getRowKey: (row: T) => string | number;
  className?: string;
}

const alignmentClasses: Record<TableColumnAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Table<T>({
  columns,
  data,
  getRowKey,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse bg-white text-sm text-black">
        <thead className="bg-[#ECECFD]">
          <tr className="h-[42px]">
            {columns.map((column) => {
              const alignment = alignmentClasses[column.align ?? "left"];

              return (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 font-semibold ${alignment} ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)} className="h-[75px] border-b border-[#878A92]/30">
              {columns.map((column) => {
                const alignment = alignmentClasses[column.align ?? "left"];

                return (
                  <td
                    key={column.id}
                    className={`px-4 align-middle ${alignment} ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
