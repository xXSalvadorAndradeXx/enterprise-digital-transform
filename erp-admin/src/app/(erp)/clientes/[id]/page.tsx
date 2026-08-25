import {
  CustomerDetailView,
} from "@/components/customers/CustomerDetailView";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    ordersPage?: SearchParamValue;
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

function getPageParam(
  value: SearchParamValue,
): number {
  const parsedPage =
    Number.parseInt(
      getStringParam(
        value,
      ),
      10,
    );

  if (
    Number.isNaN(parsedPage) ||
    parsedPage < 1
  ) {
    return 1;
  }

  return parsedPage;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const {
    id,
  } = await params;
  const {
    ordersPage,
    returnTo,
  } = await searchParams;
  const returnHref =
    getSafeReturnTo(
      returnTo,
    );
  const initialOrdersPage =
    getPageParam(
      ordersPage,
    );

  return (
    <CustomerDetailView
      customerId={
        id
      }
      initialOrdersPage={
        initialOrdersPage
      }
      returnHref={
        returnHref
      }
    />
  );
}
