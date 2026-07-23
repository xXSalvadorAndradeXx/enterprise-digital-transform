import ComprasListView from "./components/ComprasListView";

type ComprasPageProps = {
  searchParams: Promise<{
    estado?: string | string[];
  }>;
};

export default async function ComprasPage({ searchParams }: ComprasPageProps) {
  const { estado } = await searchParams;

  // Vista temporal para QA; se eliminará al integrar los datos reales en TASK 684.
  const showEmptyState = estado === "vacio";

  return <ComprasListView showEmptyState={showEmptyState} />;
}
