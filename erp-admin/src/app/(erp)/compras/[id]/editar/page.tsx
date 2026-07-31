import { PurchaseForm } from "../../components/form";
import { findEditablePurchase } from "../../data/editablePurchases";
import { LocalPurchaseEditor } from "./LocalPurchaseEditor";

type EditarCompraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCompraPage({ params }: EditarCompraPageProps) {
  const { id } = await params;
  const purchase = findEditablePurchase(id);

  if (!purchase) {
    return <LocalPurchaseEditor id={id} />;
  }

  return <PurchaseForm mode="edit" initialData={purchase} reference={purchase.reference} />;
}
