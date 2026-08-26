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
  CustomersServiceRequestError,
  customersService,
} from "@/services/customers/customers.service";

import {
  useCustomerReadPermission,
} from "@/hooks/customers/useCustomerReadPermission";

import type {
  AdminCustomerAddress,
  AdminCustomerDetail,
} from "@/types/customers";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

import {
  CustomerOrderHistory,
} from "./CustomerOrderHistory";

interface CustomerDetailViewProps {
  customerId: string;
  returnHref: string;
  initialOrdersPage: number;
}

interface CustomerDetailStateProps {
  message: string;
  tone?: "neutral" | "danger";
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

interface CommercialIndicatorProps {
  label: string;
  value: string;
}

interface CustomerAddressCardProps {
  address: AdminCustomerAddress;
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

function getAddressLocation(
  address: AdminCustomerAddress,
): string {
  const parts = [
    address.city,
    address.district.name,
    address.department.name,
  ].filter(
    (part): part is string =>
      typeof part === "string" &&
      part.trim().length > 0,
  );

  return parts.length > 0
    ? parts.join(", ")
    : "Ubicacion no especificada";
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

function CustomerAddressCard({
  address,
}: CustomerAddressCardProps) {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-gray-950">
            {address.addressLine}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {getAddressLocation(
              address,
            )}
          </p>
        </div>

        {address.isDefault && (
          <span className="inline-flex shrink-0 rounded-md bg-[#E8F0FE] px-2.5 py-1 text-xs font-semibold text-[#1C21D1]">
            Predeterminada
          </span>
        )}
      </div>
    </li>
  );
}

function CustomerAddressesSection({
  addresses,
}: {
  addresses: AdminCustomerAddress[];
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-950">
        Direcciones
      </h2>

      {addresses.length === 0 ? (
        <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            No hay direcciones registradas.
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <CustomerAddressCard
              key={
                address.id
              }
              address={
                address
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CustomerDetailContent({
  customer,
  returnHref,
  initialOrdersPage,
  canReadCustomers,
}: {
  customer: AdminCustomerDetail;
  returnHref: string;
  initialOrdersPage: number;
  canReadCustomers: boolean;
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-950">
            Informacion del cliente
          </h2>

          <dl className="mt-5 grid gap-4">
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

        <CustomerAddressesSection
          addresses={
            customer.addresses
          }
        />
      </div>

      <CustomerOrderHistory
        customerId={
          customer.id
        }
        initialPage={
          initialOrdersPage
        }
        canReadCustomers={
          canReadCustomers
        }
        returnHref={
          returnHref
        }
      />
    </div>
  );
}

function CustomerDetailState({
  message,
  tone = "neutral",
}: CustomerDetailStateProps) {
  const className =
    tone === "danger"
      ? "rounded-xl border border-red-200 bg-red-50 p-6"
      : "rounded-xl border border-gray-200 bg-white p-6";

  const textClassName =
    tone === "danger"
      ? "text-sm text-red-700"
      : "text-sm text-gray-500";

  return (
    <section className={className}>
      <p
        role={tone === "danger" ? "alert" : "status"}
        className={textClassName}
      >
        {message}
      </p>
    </section>
  );
}

export function CustomerDetailView({
  customerId,
  returnHref,
  initialOrdersPage,
}: CustomerDetailViewProps) {
  const {
    isCheckingCustomerPermission,
    canReadCustomers,
    customerPermissionError,
  } = useCustomerReadPermission();
  const [
    customer,
    setCustomer,
  ] =
    useState<AdminCustomerDetail | null>(
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
    if (isCheckingCustomerPermission) {
      setCustomer(
        null,
      );
      setIsLoading(
        true,
      );
      setError(
        "",
      );
      setIsNotFound(
        false,
      );
      return;
    }

    if (!canReadCustomers) {
      setCustomer(
        null,
      );
      setIsLoading(
        false,
      );
      setError(
        "",
      );
      setIsNotFound(
        false,
      );
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
    setIsNotFound(
      false,
    );

    void customersService.getCustomer(
      customerId,
      {
        signal:
          controller.signal,
      },
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
            CustomersServiceRequestError &&
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
    isCheckingCustomerPermission,
    canReadCustomers,
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

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[var(--font-title)] text-[32px] font-bold text-gray-950">
          Detalle del cliente
        </h1>

        <Link
          href={returnHref}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1C21D1] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#171BB8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1] focus-visible:ring-offset-2"
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
          />
          <span>Volver</span>
        </Link>
      </header>

      {isCheckingCustomerPermission || isLoading ? (
        <CustomerDetailState message="Verificando permisos administrativos..." />
      ) : !canReadCustomers ? (
        <CustomerDetailState
          message={
            customerPermissionError ||
            "No tienes permiso para consultar clientes."
          }
          tone="danger"
        />
      ) : isNotFound ? (
        <CustomerDetailState message="Cliente no encontrado." />
      ) : error ? (
        <CustomerDetailState
          message={error}
          tone="danger"
        />
      ) : customer ? (
        <CustomerDetailContent
          customer={
            customer
          }
          returnHref={
            returnHref
          }
          initialOrdersPage={
            initialOrdersPage
          }
          canReadCustomers={
            canReadCustomers
          }
        />
      ) : null}
    </main>
  );
}
