"use client";

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

interface CustomersTableProps {
  customers: AdminCustomerListItem[];
  isLoading?: boolean;
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

const columns: TableColumn<AdminCustomerListItem>[] = [
  {
    key:
      "fullName",
    header:
      "Nombre",
    accessor: (
      customer,
    ) => (
      <span
        className="block max-w-[220px] truncate font-medium text-gray-800"
        title={
          customer.fullName
        }
      >
        {
          customer.fullName
        }
      </span>
    ),
  },
  {
    key:
      "email",
    header:
      "Correo electrónico",
    accessor: (
      customer,
    ) => (
      <span
        className="block max-w-[260px] truncate text-gray-600"
        title={
          customer.email
        }
      >
        {
          customer.email
        }
      </span>
    ),
  },
  {
    key:
      "lastOrderAt",
    header:
      "Último pedido",
    accessor: (
      customer,
    ) =>
      formatLastOrderAt(
        customer.lastOrderAt,
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
    ) =>
      formatTotalSpent(
        customer.totalSpent,
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
    ) =>
      customer.totalOrders.toLocaleString(
        "es-SV",
      ),
  },
];

export function CustomersTable({
  customers,
  isLoading = false,
}: CustomersTableProps) {
  return (
    <Table<AdminCustomerListItem>
      columns={
        columns
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
