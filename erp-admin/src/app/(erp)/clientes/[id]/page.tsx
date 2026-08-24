import {
  CustomerDetailView,
} from "@/components/customers/CustomerDetailView";

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
    <CustomerDetailView
      customerId={
        id
      }
      returnHref={
        returnHref
      }
    />
  );
}
