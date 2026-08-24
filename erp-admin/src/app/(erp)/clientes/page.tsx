import {
  CustomersListView,
} from "@/components/customers/CustomersListView";

interface ClientesPageProps {
  searchParams: Promise<{
    search?: SearchParamValue;
    lastOrderFrom?: SearchParamValue;
    lastOrderTo?: SearchParamValue;
    page?: SearchParamValue;
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
    Number(value);

  return Number.isInteger(
    candidate,
  ) && candidate > 0
    ? candidate
    : 1;
}

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  const params =
    await searchParams;

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
    />
  );
}
