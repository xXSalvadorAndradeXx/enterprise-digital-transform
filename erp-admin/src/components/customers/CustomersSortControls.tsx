"use client";

import {
  Select,
} from "@/components/ui/Select";

import {
  ADMIN_CUSTOMER_SORT_BY_VALUES,
  SORT_ORDER_VALUES,
} from "@/types/customers";

import type {
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

interface CustomersSortControlsProps {
  sortBy: AdminCustomerSortBy | "";
  order: SortOrder;
  onSortByChange: (value: AdminCustomerSortBy | "") => void;
  onOrderChange: (value: SortOrder) => void;
}

const SORT_BY_OPTIONS = [
  {
    value:
      "",
    label:
      "Sin ordenar",
  },
  {
    value:
      "fullName",
    label:
      "Nombre",
  },
  {
    value:
      "lastOrderAt",
    label:
      "Ultimo pedido",
  },
  {
    value:
      "totalSpent",
    label:
      "Total gastado",
  },
  {
    value:
      "totalOrders",
    label:
      "Total pedidos",
  },
];

const ORDER_OPTIONS = [
  {
    value:
      "ASC",
    label:
      "ASC",
  },
  {
    value:
      "DESC",
    label:
      "DESC",
  },
];

function isAdminCustomerSortBy(
  value: string,
): value is AdminCustomerSortBy {
  return ADMIN_CUSTOMER_SORT_BY_VALUES.includes(
    value as AdminCustomerSortBy,
  );
}

function isSortOrder(
  value: string,
): value is SortOrder {
  return SORT_ORDER_VALUES.includes(
    value as SortOrder,
  );
}

export function CustomersSortControls({
  sortBy,
  order,
  onSortByChange,
  onOrderChange,
}: CustomersSortControlsProps) {
  return (
    <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[200px_120px]">
      <Select
        label="Ordenar por"
        value={
          sortBy
        }
        onChange={(value) => {
          onSortByChange(
            isAdminCustomerSortBy(
              value,
            )
              ? value
              : "",
          );
        }}
        options={
          SORT_BY_OPTIONS
        }
      />

      <Select
        label="Direccion"
        value={
          order
        }
        onChange={(value) => {
          if (
            isSortOrder(
              value,
            )
          ) {
            onOrderChange(
              value,
            );
          }
        }}
        options={
          ORDER_OPTIONS
        }
        disabled={
          !sortBy
        }
      />
    </div>
  );
}
