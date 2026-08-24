import Link from "next/link";

import {
  ArrowLeft,
} from "lucide-react";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: SearchParamValue;
  }>;
}

type SearchParamValue =
  | string
  | string[]
  | undefined;

const INTERNAL_URL_ORIGIN =
  "http://internal.local";

function getStringParam(
  value: SearchParamValue,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getSafeReturnTo(
  value: SearchParamValue,
): string {
  const candidate =
    getStringParam(
      value,
    );

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//")
  ) {
    return "/clientes";
  }

  try {
    const parsedUrl =
      new URL(
        candidate,
        INTERNAL_URL_ORIGIN,
      );

    if (
      parsedUrl.origin !==
        INTERNAL_URL_ORIGIN ||
      parsedUrl.pathname !==
        "/clientes"
    ) {
      return "/clientes";
    }

    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "/clientes";
  }
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const {
    id,
  } = await params;
  const {
    returnTo,
  } = await searchParams;
  const returnHref =
    getSafeReturnTo(
      returnTo,
    );

  return (
    <main className="w-full min-w-0">
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

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-500">
          Cliente
        </p>
        <h1 className="mt-2 font-[var(--font-title)] text-[32px] font-bold text-gray-950">
          Detalle del cliente
        </h1>
        <dl className="mt-6 grid gap-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">
              ID del cliente
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-gray-800">
              {id}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
