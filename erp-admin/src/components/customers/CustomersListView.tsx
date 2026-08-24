"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Pagination,
} from "@/components/ui/Pagination";

import {
  getAdminCustomers,
} from "@/services/customers/getAdminCustomers";

import {
  CustomersTable,
} from "./CustomersTable";

import type {
  AdminCustomerListItem,
} from "@/types/customers";

import type {
  PageMeta,
} from "@/types/api-contract.types";

const PAGE_SIZE = 5;

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

export function CustomersListView() {
  const [
    page,
    setPage,
  ] = useState(1);
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
  ]);

  const showPagination =
    meta.totalPages > 1;

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

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <CustomersTable
          customers={
            customers
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
