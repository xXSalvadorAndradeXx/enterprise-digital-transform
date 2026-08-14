"use client";

import { Eye, Trash2 } from "lucide-react";

import { Table } from "@/components/ui/Table";
import { ProductImage } from "./ProductImage";
import { ProductStockStatus } from "./ProductStockStatus";

import type { ProductTableItem } from "@/types/productos";

interface ProductsTableProps {
  products: ProductTableItem[];
  isLoading?: boolean;
  search: string;
  onView: (product: ProductTableItem) => void;
  onDelete: (product: ProductTableItem) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ProductsTable({
  products,
  isLoading = false,
  search,
  onView,
  onDelete,
}: ProductsTableProps) {
  return (
    <Table<ProductTableItem>
      data={products}
      rowKey={(product) => product.id}
      isLoading={isLoading}
      actionsHeader="Acciones"
      columns={[
        {
            key: "image",
            header: "Foto",
            width: "70px",
            accessor: (product) => (
                <ProductImage
                src={product.imageUrl}
                alt={product.name}
                />
            ),
        },
        {
          key: "name",
          header: "Nombre",
          accessor: (product) => (
            <div
              className="max-w-[220px] truncate font-medium text-gray-700"
              title={product.name}
            >
              {product.name}
            </div>
          ),
        },
        {
          key: "category",
          header: "Categoría",
          accessor: (product) => (
            <div
              className="max-w-[150px] truncate"
              title={product.category}
            >
              {product.category}
            </div>
          ),
        },
        {
          key: "price",
          header: "Precio",
          accessor: (product) =>
            formatCurrency(product.price),
        },
        {
          key: "stock",
          header: "Stock",
          accessor: (product) =>
            product.stock.toLocaleString("en-US"),
        },
        {
          key: "stockStatus",
          header: "Estado",
          accessor: (product) => (
            <ProductStockStatus
              status={product.stockStatus}
            />
          ),
        },
      ]}
      actions={[
        {
          label: "Ver",
          icon: Eye,
          onClick: onView,
          className:
            "rounded border border-gray-400 p-1 text-gray-900 transition-colors hover:bg-gray-100",
        },
        {
          label: "Eliminar",
          icon: Trash2,
          onClick: onDelete,
          className:
            "rounded border border-gray-300 p-1 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50",
        },
      ]}
      emptyMessage={
        search.trim()
          ? `No se encontraron productos para "${search.trim()}".`
          : "Todavía no hay productos registrados."
      }
    />
  );
}