"use client";

import {
  Eye,
  Trash2,
} from "lucide-react";

import {
  Table,
} from "@/components/ui/Table";

import {
  ProductImage,
} from "./ProductImage";

import {
  ProductStockStatus,
} from "./ProductStockStatus";

import type {
  ProductSummary,
} from "@/types/productos";

interface ProductsTableProps {
  products:
    ProductSummary[];

  search:
    string;

  onView: (
    product:
      ProductSummary,
  ) => void;

  onDelete: (
    product:
      ProductSummary,
  ) => void;
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

      minimumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}

export function ProductsTable({
  products,
  search,
  onView,
  onDelete,
}: ProductsTableProps) {
  return (
    <Table<ProductSummary>
      data={
        products
      }
      rowKey={(
        product,
      ) =>
        product.id
      }
      actionsHeader="Acciones"
      columns={[
        {
          key:
            "image",

          header:
            "Foto",

          width:
            "70px",

          accessor: (
            product,
          ) => {
            const imageUrl =
              product
                .images[0]
                ?.imageUrl ??
              "";

            return (
              <ProductImage
                src={
                  imageUrl
                }
                alt={
                  product
                    .commercialName
                }
              />
            );
          },
        },

        {
          key:
            "name",

          header:
            "Nombre",

          sortable:
            true,

          accessor: (
            product,
          ) => (
            <div
              className="max-w-[220px] truncate font-medium text-gray-700"
              title={
                product
                  .commercialName
              }
            >
              {
                product
                  .commercialName
              }
            </div>
          ),
        },

        {
          key:
            "category",

          header:
            "Categoría",

          accessor: (
            product,
          ) => {
            const category =
              product
                .inventory
                ?.category
                ?.name ??
              "Sin categoría";

            return (
              <div
                className="max-w-[150px] truncate"
                title={
                  category
                }
              >
                {
                  category
                }
              </div>
            );
          },
        },

        {
          key:
            "price",

          header:
            "Precio",

          accessor: (
            product,
          ) =>
            formatCurrency(
              product
                .effectivePrice,
            ),
        },

        {
          key:
            "stock",

          header:
            "Stock",

          accessor: (
            product,
          ) =>
            (
              product
                .inventory
                ?.totalStock ??
              0
            ).toLocaleString(
              "en-US",
            ),
        },

        {
          key:
            "stockStatus",

          header:
            "Estado",

          accessor: (
            product,
          ) => {
            const status =
              product
                .inventory
                ?.status;

            if (
              status !==
                "ACTIVE" &&
              status !==
                "LOW_STOCK" &&
              status !==
                "OUT_OF_STOCK"
            ) {
              return (
                <span className="text-sm text-gray-500">
                  Sin información
                </span>
              );
            }

            return (
              <ProductStockStatus
                status={
                  status === "ACTIVE"
                    ? "ALTO"
                    : status === "LOW_STOCK"
                      ? "MEDIO"
                      : "BAJO"
                }
              />
            );
          },
        },
      ]}
      actions={[
        {
          label:
            "Ver",

          icon:
            Eye,

          onClick:
            onView,

          className:
            "rounded border border-gray-400 p-1 text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400",
        },

        {
          label:
            "Eliminar",

          icon:
            Trash2,

          onClick:
            onDelete,

          className:
            "rounded border border-gray-300 p-1 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300",
        },
      ]}
      emptyMessage={
        search.trim()
          ? `No se encontraron productos para "${search.trim()}".`
          : "No hay productos aún."
      }
    />
  );
}
