"use client";

import Link from "next/link";

import {
  Table,
  type TableColumn,
} from "@/components/ui/Table";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

import type {
  AdminCustomerListItem,
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
}

interface CustomerCellLinkProps {
  customer: AdminCustomerListItem;
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

function formatLastOrderAt(
  value: string,
): string {
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
  className = "",
  children,
}: CustomerCellLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`Ver detalle del cliente ${customer.fullName}`}
      title={title}
      className={`-mx-4 -my-3 block px-4 py-3 transition-colors hover:text-[#1C21D1] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1] ${className}`}
    >
      {children}
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
            className="max-w-[220px] truncate font-medium text-gray-800"
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
            className="max-w-[260px] truncate text-gray-600"
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
}: CustomersTableProps) {
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
      emptyMessage="No hay clientes para mostrar."
    />
  );
}
