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

import type {
  AdminCustomerListItem,
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
}

interface CustomersListQueryState {
  search: string;
  lastOrderFrom: string;
  lastOrderTo: string;
  page: number;
}

function buildCustomersListHref({
  search,
  lastOrderFrom,
  lastOrderTo,
  page,
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

export function CustomersListView({
  initialSearch = "",
  initialLastOrderFrom = "",
  initialLastOrderTo = "",
  initialPage = 1,
}: CustomersListViewProps) {
  const router =
    useRouter();
  const hasMountedSearchEffect =
    useRef(false);
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

  const currentListHref =
    buildCustomersListHref({
      search:
        debouncedSearch,
      lastOrderFrom,
      lastOrderTo,
      page,
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
      },
      controller.signal,
    )
      .then((response) => {
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
        if (!controller.signal.aborted) {
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

  const getCustomerHref = (
    customer: AdminCustomerListItem,
  ): string =>
    buildCustomerDetailHref(
      customer.id,
      currentListHref,
    );

  return (
    <div className="w-full min-w-0">
      <header className="mb-6">
        <h1 className="font-[var(--font-title)] text-[32px] font-bold text-gray-950">
          Clientes
        </h1>
      </header>

      {error && (
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
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 px-4 py-6">
          <SearchBar
            value={
              search
            }
            onChange={
              setSearch
            }
            placeholder="Buscar por nombre o correo..."
            className="w-full sm:w-[320px]"
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
