import { LocalPurchaseEditor } from "./LocalPurchaseEditor";

type EditarCompraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCompraPage({ params }: EditarCompraPageProps) {
  const { id } = await params;
  return <LocalPurchaseEditor id={id} />;
}
