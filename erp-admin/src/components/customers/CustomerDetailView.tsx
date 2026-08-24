"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

import {
  AdminCustomerDetailRequestError,
  getAdminCustomerById,
  type ProvisionalAdminCustomerDetail,
} from "@/services/customers/getAdminCustomerById";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

interface CustomerDetailViewProps {
  customerId: string;
  returnHref: string;
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

interface CommercialIndicatorProps {
  label: string;
  value: string;
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

function ReadOnlyField({
  label,
  value,
}: ReadOnlyFieldProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <dt className="text-sm font-medium text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value}
      </dd>
    </div>
  );
}

function CommercialIndicator({
  label,
  value,
}: CommercialIndicatorProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <dt className="text-sm font-medium text-gray-500">
        {label}
      </dt>
      <dd className="mt-2 text-xl font-bold text-gray-950">
        {value}
      </dd>
    </div>
  );
}

function CustomerDetailContent({
  customer,
}: {
  customer: ProvisionalAdminCustomerDetail;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-950">
          Informacion del cliente
        </h2>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <ReadOnlyField
            label="Nombre completo"
            value={
              customer.fullName
            }
          />
          <ReadOnlyField
            label="Telefono"
            value={
              customer.phone
            }
          />
          <ReadOnlyField
            label="Correo electronico"
            value={
              customer.email
            }
          />
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-950">
          Indicadores comerciales
        </h2>

        <dl className="mt-5 grid gap-4">
          <CommercialIndicator
            label="Ultimo pedido"
            value={formatLastOrderAt(
              customer.lastOrderAt,
            )}
          />
          <CommercialIndicator
            label="Total gastado"
            value={formatTotalSpent(
              customer.totalSpent,
            )}
          />
          <CommercialIndicator
            label="Total pedidos"
            value={customer.totalOrders.toLocaleString(
              "es-SV",
            )}
          />
        </dl>
      </section>
    </div>
  );
}

export function CustomerDetailView({
  customerId,
  returnHref,
}: CustomerDetailViewProps) {
  const [
    customer,
    setCustomer,
  ] =
    useState<ProvisionalAdminCustomerDetail | null>(
      null,
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
    isNotFound,
    setIsNotFound,
  ] = useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    setIsLoading(
      true,
    );
    setError(
      "",
    );
    setIsNotFound(
      false,
    );

    void getAdminCustomerById(
      customerId,
      controller.signal,
    )
      .then((response) => {
        setCustomer(
          response,
        );
      })
      .catch((caughtError) => {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setCustomer(
          null,
        );

        if (
          caughtError instanceof
            AdminCustomerDetailRequestError &&
          caughtError.status === 404
        ) {
          setIsNotFound(
            true,
          );
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el detalle del cliente.",
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
    customerId,
  ]);

  return (
    <main className="w-full min-w-0">
      <nav
        aria-label="Breadcrumb"
        className="mb-4"
      >
        <ol className="flex items-center text-sm">
          <li>
            <Link
              href={returnHref}
              className="text-gray-500 transition-colors hover:text-[#1C21D1]"
            >
              Clientes
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight
              size={16}
              className="mx-2 text-gray-400"
            />
          </li>
          <li
            className="font-medium text-gray-950"
            aria-current="page"
          >
            Detalle del cliente
          </li>
        </ol>
      </nav>

      <Link
        href={returnHref}
        className="mb-6 inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#1C21D1] hover:text-[#1C21D1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1]"
      >
        <ArrowLeft
          size={16}
          aria-hidden="true"
        />
        <span>Volver a clientes</span>
      </Link>

      <header className="mb-6">
        <h1 className="font-[var(--font-title)] text-[32px] font-bold text-gray-950">
          Detalle del cliente
        </h1>
      </header>

      {isLoading ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Cargando cliente...
          </p>
        </section>
      ) : isNotFound ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-950">
            Cliente no encontrado.
          </p>
        </section>
      ) : error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p
            role="alert"
            className="text-sm text-red-700"
          >
            {error}
          </p>
        </section>
      ) : customer ? (
        <CustomerDetailContent
          customer={
            customer
          }
        />
      ) : null}
    </main>
  );
}
