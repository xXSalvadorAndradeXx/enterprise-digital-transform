import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export interface TableColumn<T> {
  /** Unique key. Also used to match sortConfig.key when the column is sortable */
  key: string;
  header: string;
  /** Renders the cell content for a given row */
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface TableAction<T> {
  icon: LucideIcon;
  label: string;
  onClick: (row: T) => void;
  /** Conditionally show this action per row, e.g. hide "Desactivar" for already-inactive rows */
  show?: (row: T) => boolean;
  className?: string;
}

export interface TableSortConfig {
  key: string;
  direction: SortDirection;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;

  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;

  actions?: TableAction<T>[];

  /** Rendered on the right side of the toolbar that appears while there's an active selection */
  bulkActions?: (selectedCount: number, clearSelection: () => void) => ReactNode;

  sortConfig?: TableSortConfig | null;
  onSortChange?: (key: string) => void;

  isLoading?: boolean;
  emptyMessage?: string;
}