import { notFound } from "next/navigation";

import { PurchaseForm } from "../../components/form";
import { findEditablePurchase } from "../../data/editablePurchases";

type EditarCompraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCompraPage({ params }: EditarCompraPageProps) {
  const { id } = await params;
  const purchase = findEditablePurchase(id);

  if (!purchase) {
    notFound();
  }

  return <PurchaseForm mode="edit" initialData={purchase} reference={purchase.reference} />;
}
