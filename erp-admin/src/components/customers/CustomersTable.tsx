"use client";

import Link from "next/link";

import {
  Table,
  type TableColumn,
  type TableSortConfig,
} from "@/components/ui/Table";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

import type {
  AdminCustomerListItem,
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

import type {
  ReactNode,
} from "react";

interface CustomersTableProps {
  customers: AdminCustomerListItem[];
  getCustomerHref: (
    customer: AdminCustomerListItem,
  ) => string;
  isLoading?: boolean;
  sortBy: AdminCustomerSortBy | "";
  order: SortOrder;
  onSortChange: (key: string) => void;
}

interface CustomerCellLinkProps {
  customer: AdminCustomerListItem;
  href: string;
  title?: string;
  linkClassName?: string;
  contentClassName?: string;
  isPrimary?: boolean;
  children: ReactNode;
}

function formatLastOrderAt(
  value: string | null,
): string {
  if (!value) {
    return "Sin pedidos";
  }

  return new Intl.DateTimeFormat(
    "es-SV",
    {
      dateStyle:
        "medium",
    },
  ).format(
    new Date(value),
  );
}

function formatTotalSpent(
  value: string,
): string {
  return formatCurrency(
    Number(value),
  );
}

function CustomerCellLink({
  customer,
  href,
  title,
  linkClassName = "",
  contentClassName = "",
  isPrimary = false,
  children,
}: CustomerCellLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`Ver detalle del cliente ${customer.fullName}`}
      title={title}
      tabIndex={
        isPrimary
          ? undefined
          : -1
      }
      className={`-mx-4 -my-3 flex min-h-[44px] w-[calc(100%+2rem)] cursor-pointer items-center px-4 py-3 transition-colors hover:text-[#1C21D1] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1] ${linkClassName}`}
    >
      <span
        className={`min-w-0 ${contentClassName}`}
      >
        {children}
      </span>
    </Link>
  );
}

function buildColumns(
  getCustomerHref: (
    customer: AdminCustomerListItem,
  ) => string,
): TableColumn<AdminCustomerListItem>[] {
  return [
    {
      key:
        "fullName",
      sortable:
        true,
      header:
        "Nombre",
      accessor: (
        customer,
      ) => {
        const href =
          getCustomerHref(
            customer,
          );

        return (
          <CustomerCellLink
            customer={
              customer
            }
            href={
              href
            }
            title={
              customer.fullName
            }
            isPrimary
            contentClassName="max-w-[220px] truncate font-medium text-gray-800"
          >
            {
              customer.fullName
            }
          </CustomerCellLink>
        );
      },
    },
    {
      key:
        "email",
      header:
        "Correo electrónico",
      accessor: (
        customer,
      ) => {
        const href =
          getCustomerHref(
            customer,
          );

        return (
          <CustomerCellLink
            customer={
              customer
            }
            href={
              href
            }
            title={
              customer.email
            }
            contentClassName="max-w-[260px] truncate text-gray-600"
          >
            {
              customer.email
            }
          </CustomerCellLink>
        );
      },
    },
    {
      key:
        "lastOrderAt",
      sortable:
        true,
      header:
        "Último pedido",
      accessor: (
        customer,
      ) => (
        <CustomerCellLink
          customer={
            customer
          }
          href={
            getCustomerHref(
              customer,
            )
          }
          linkClassName="justify-end"
        >
          {formatLastOrderAt(
            customer.lastOrderAt,
          )}
        </CustomerCellLink>
      ),
    },
    {
      key:
        "totalSpent",
      sortable:
        true,
      header:
        "Total gastado",
      align:
        "right",
      accessor: (
        customer,
      ) => (
        <CustomerCellLink
          customer={
            customer
          }
          href={
            getCustomerHref(
              customer,
            )
          }
          linkClassName="justify-center"
        >
          {formatTotalSpent(
            customer.totalSpent,
          )}
        </CustomerCellLink>
      ),
    },
    {
      key:
        "totalOrders",
      sortable:
        true,
      header:
        "Total pedidos",
      align:
        "center",
      accessor: (
        customer,
      ) => (
        <CustomerCellLink
          customer={
            customer
          }
          href={
            getCustomerHref(
              customer,
            )
          }
        >
          {customer.totalOrders.toLocaleString(
            "es-SV",
          )}
        </CustomerCellLink>
      ),
    },
  ];
}

export function CustomersTable({
  customers,
  getCustomerHref,
  isLoading = false,
  sortBy,
  order,
  onSortChange,
}: CustomersTableProps) {
  const sortConfig: TableSortConfig | null =
    sortBy
      ? {
          key:
            sortBy,
          direction:
            order === "ASC"
              ? "asc"
              : "desc",
        }
      : null;

  return (
    <Table<AdminCustomerListItem>
      columns={
        buildColumns(
          getCustomerHref,
        )
      }
      data={
        customers
      }
      rowKey={(
        customer,
      ) =>
        customer.id
      }
      isLoading={
        isLoading
      }
      sortConfig={
        sortConfig
      }
      onSortChange={
        onSortChange
      }
      emptyMessage="No hay clientes para mostrar."
    />
  );
}
