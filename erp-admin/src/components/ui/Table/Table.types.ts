import { ReactNode } from "react";

export interface TableColumn {
  header: string;
  accessor: string;
  width?: string;
  render?: (value: any, row: Record<string, any>) => ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  className?: string;
  footer?: ReactNode;
  showBorder?: boolean;
}