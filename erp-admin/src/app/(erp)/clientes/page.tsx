import {
  CustomersListView,
} from "@/components/customers/CustomersListView";

import {
  ADMIN_CUSTOMER_SORT_BY_VALUES,
  SORT_ORDER_VALUES,
} from "@/types/customers";

import type {
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

interface ClientesPageProps {
  searchParams: Promise<{
    search?: SearchParamValue;
    lastOrderFrom?: SearchParamValue;
    lastOrderTo?: SearchParamValue;
    page?: SearchParamValue;
    sortBy?: SearchParamValue;
    order?: SearchParamValue;
  }>;
}

type SearchParamValue =
  | string
  | string[]
  | undefined;

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

function getStringParam(
  value: SearchParamValue,
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getDateParam(
  value: SearchParamValue,
): string {
  const candidate =
    getStringParam(
      value,
    );

  return ISO_DATE_PATTERN.test(
    candidate,
  )
    ? candidate
    : "";
}

function getPageParam(
  value: SearchParamValue,
): number {
  const candidate =
    Number(
      getStringParam(
        value,
      ),
    );

  return Number.isInteger(
    candidate,
  ) && candidate > 0
    ? candidate
    : 1;
}

function getSortByParam(
  value: SearchParamValue,
): AdminCustomerSortBy | "" {
  const candidate =
    getStringParam(
      value,
    );

  return ADMIN_CUSTOMER_SORT_BY_VALUES.includes(
    candidate as AdminCustomerSortBy,
  )
    ? (candidate as AdminCustomerSortBy)
    : "";
}

function getOrderParam(
  value: SearchParamValue,
): SortOrder {
  const candidate =
    getStringParam(
      value,
    );

  return SORT_ORDER_VALUES.includes(
    candidate as SortOrder,
  )
    ? (candidate as SortOrder)
    : "ASC";
}

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  const params =
    await searchParams;
  const initialSortBy =
    getSortByParam(
      params.sortBy,
    );

  return (
    <CustomersListView
      initialSearch={
        getStringParam(
          params.search,
        )
      }
      initialLastOrderFrom={
        getDateParam(
          params.lastOrderFrom,
        )
      }
      initialLastOrderTo={
        getDateParam(
          params.lastOrderTo,
        )
      }
      initialPage={
        getPageParam(
          params.page,
        )
      }
      initialSortBy={
        initialSortBy
      }
      initialOrder={
        initialSortBy
          ? getOrderParam(
              params.order,
            )
          : "ASC"
      }
    />
  );
}
