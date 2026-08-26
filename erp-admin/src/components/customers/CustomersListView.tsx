"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Pagination,
} from "@/components/ui/Pagination";

import {
  SearchBar,
} from "@/components/ui/SearchBar";

import {
  getAdminCustomers,
} from "@/services/customers/getAdminCustomers";

import {
  CustomersTable,
} from "./CustomersTable";

import {
  LastOrderDateFilter,
} from "./LastOrderDateFilter";

import {
  ADMIN_CUSTOMER_SORT_BY_VALUES,
} from "@/types/customers";

import type {
  AdminCustomerListItem,
  AdminCustomerSortBy,
  SortOrder,
} from "@/types/customers";

import type {
  PageMeta,
} from "@/types/api-contract.types";

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_META: PageMeta = {
  page:
    1,
  limit:
    PAGE_SIZE,
  total:
    0,
  totalPages:
    0,
  hasNextPage:
    false,
  hasPreviousPage:
    false,
};

interface CustomersListViewProps {
  initialSearch?: string;
  initialLastOrderFrom?: string;
  initialLastOrderTo?: string;
  initialPage?: number;
  initialSortBy?: AdminCustomerSortBy | "";
  initialOrder?: SortOrder;
}

interface CustomersListQueryState {
  search: string;
  lastOrderFrom: string;
  lastOrderTo: string;
  page: number;
  sortBy: AdminCustomerSortBy | "";
  order: SortOrder;
}

function buildCustomersListHref({
  search,
  lastOrderFrom,
  lastOrderTo,
  page,
  sortBy,
  order,
}: CustomersListQueryState): string {
  const params =
    new URLSearchParams();
  const normalizedSearch =
    search.trim();

  if (normalizedSearch) {
    params.set(
      "search",
      normalizedSearch,
    );
  }

  if (lastOrderFrom) {
    params.set(
      "lastOrderFrom",
      lastOrderFrom,
    );
  }

  if (lastOrderTo) {
    params.set(
      "lastOrderTo",
      lastOrderTo,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  if (sortBy) {
    params.set(
      "sortBy",
      sortBy,
    );
    params.set(
      "order",
      order,
    );
  }

  const query =
    params.toString();

  return query
    ? `/clientes?${query}`
    : "/clientes";
}

function buildCustomerDetailHref(
  customerId: string,
  returnTo: string,
): string {
  const params =
    new URLSearchParams({
      returnTo,
    });

  return `/clientes/${customerId}?${params.toString()}`;
}

function getDateRangeError(
  lastOrderFrom: string,
  lastOrderTo: string,
): string {
  if (
    lastOrderFrom &&
    lastOrderTo &&
    lastOrderFrom > lastOrderTo
  ) {
    return "La fecha inicial no puede ser posterior a la fecha final.";
  }

  return "";
}

function isAdminCustomerSortBy(
  value: string,
): value is AdminCustomerSortBy {
  return ADMIN_CUSTOMER_SORT_BY_VALUES.includes(
    value as AdminCustomerSortBy,
  );
}

export function CustomersListView({
  initialSearch = "",
  initialLastOrderFrom = "",
  initialLastOrderTo = "",
  initialPage = 1,
  initialSortBy = "",
  initialOrder = "ASC",
}: CustomersListViewProps) {
  const router =
    useRouter();
  const hasMountedSearchEffect =
    useRef(false);
  const latestRequestId =
    useRef(0);
  const [
    page,
    setPage,
  ] = useState(initialPage);
  const [
    customers,
    setCustomers,
  ] =
    useState<AdminCustomerListItem[]>(
      [],
    );
  const [
    meta,
    setMeta,
  ] = useState<PageMeta>(
    EMPTY_META,
  );
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState("");
  const [
    search,
    setSearch,
  ] = useState(initialSearch);
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    initialSearch,
  );
  const [
    lastOrderFrom,
    setLastOrderFrom,
  ] = useState(
    initialLastOrderFrom,
  );
  const [
    lastOrderTo,
    setLastOrderTo,
  ] = useState(
    initialLastOrderTo,
  );
  const [
    sortBy,
    setSortBy,
  ] =
    useState<AdminCustomerSortBy | "">(
      initialSortBy,
    );
  const [
    order,
    setOrder,
  ] = useState<SortOrder>(
    initialOrder,
  );

  const dateRangeError =
    getDateRangeError(
      lastOrderFrom,
      lastOrderTo,
    );

  const currentListHref =
    buildCustomersListHref({
      search:
        debouncedSearch,
      lastOrderFrom,
      lastOrderTo,
      page,
      sortBy,
      order,
    });

  useEffect(() => {
    if (
      !hasMountedSearchEffect.current
    ) {
      hasMountedSearchEffect.current =
        true;
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim(),
        );
        setPage(
          1,
        );
      }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    search,
  ]);

  useEffect(() => {
    router.replace(
      currentListHref,
      {
        scroll:
          false,
      },
    );
  }, [
    currentListHref,
    router,
  ]);

  useEffect(() => {
    const requestId =
      latestRequestId.current + 1;

    latestRequestId.current =
      requestId;

    if (dateRangeError) {
      setIsLoading(
        false,
      );
      setError(
        "",
      );
      setCustomers(
        [],
      );
      setMeta({
        ...EMPTY_META,
        page,
      });
      return;
    }

    const controller =
      new AbortController();

    setIsLoading(
      true,
    );
    setError(
      "",
    );

    void getAdminCustomers(
      {
        page,
        limit:
          PAGE_SIZE,
        search:
          debouncedSearch,
        lastOrderFrom,
        lastOrderTo,
        sortBy:
          sortBy || undefined,
        order:
          sortBy
            ? order
            : undefined,
      },
      controller.signal,
    )
      .then((response) => {
        if (
          controller.signal.aborted ||
          requestId !==
            latestRequestId.current
        ) {
          return;
        }

        setCustomers(
          response.items,
        );
        setMeta(
          response.meta,
        );
      })
      .catch((caughtError) => {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        if (
          requestId !==
          latestRequestId.current
        ) {
          return;
        }

        setCustomers(
          [],
        );
        setMeta({
          ...EMPTY_META,
          page,
        });
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar los clientes.",
        );
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          requestId ===
            latestRequestId.current
        ) {
          setIsLoading(
            false,
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    page,
    debouncedSearch,
    lastOrderFrom,
    lastOrderTo,
    sortBy,
    order,
    dateRangeError,
  ]);

  const showPagination =
    meta.totalPages > 1;

  const changeLastOrderFrom = (
    value: string,
  ): void => {
    setLastOrderFrom(
      value,
    );
    setPage(
      1,
    );
  };

  const changeLastOrderTo = (
    value: string,
  ): void => {
    setLastOrderTo(
      value,
    );
    setPage(
      1,
    );
  };

  const clearLastOrderFilter = (): void => {
    setLastOrderFrom(
      "",
    );
    setLastOrderTo(
      "",
    );
    setPage(
      1,
    );
  };

  const changeSort = (
    key: string,
  ): void => {
    if (!isAdminCustomerSortBy(key)) {
      return;
    }

    setPage(
      1,
    );

    if (sortBy !== key) {
      setSortBy(
        key,
      );
      setOrder(
        "ASC",
      );
      return;
    }

    if (order === "ASC") {
      setOrder(
        "DESC",
      );
      return;
    }

    setSortBy(
      "",
    );
    setOrder(
      "ASC",
    );
  };

  const getCustomerHref = (
    customer: AdminCustomerListItem,
  ): string =>
    buildCustomerDetailHref(
      customer.id,
      currentListHref,
    );

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0">
      {dateRangeError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {
            dateRangeError
          }
        </p>
      )}

      {!dateRangeError && error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {
            error
          }
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h1 className="font-[var(--font-title)] text-2xl font-bold text-gray-950">
            Tabla de clientes
          </h1>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <SearchBar
              value={
                search
              }
              onChange={
                setSearch
              }
              placeholder="Buscar..."
              className="w-full sm:w-[260px]"
            />

            <LastOrderDateFilter
              from={
                lastOrderFrom
              }
              to={
                lastOrderTo
              }
              onFromChange={
                changeLastOrderFrom
              }
              onToChange={
                changeLastOrderTo
              }
              onClear={
                clearLastOrderFilter
              }
            />
          </div>
        </div>

        <CustomersTable
          customers={
            customers
          }
          getCustomerHref={
            getCustomerHref
          }
          isLoading={
            isLoading
          }
          sortBy={
            sortBy
          }
          order={
            order
          }
          onSortChange={
            changeSort
          }
        />

        {showPagination && (
          <div className="border-t border-gray-100">
            <Pagination
              currentPage={
                meta.page
              }
              totalPages={
                meta.totalPages
              }
              onPageChange={
                setPage
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
