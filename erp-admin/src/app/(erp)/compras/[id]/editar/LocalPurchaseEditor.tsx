"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PurchaseForm } from "../../components/form";
import { getPurchaseById } from "../../services/purchases.service";
import type { EditablePurchase } from "../../types/purchaseEdit.types";
import type { PurchaseResponse } from "../../types/purchases.types";

type LocalPurchaseEditorProps = {
  id: string;
};

function toEditablePurchase(purchase: PurchaseResponse): EditablePurchase {
  const invoiceUrl = purchase.invoiceUrl ?? "";
  const invoiceIsPdf = invoiceUrl.toLowerCase().includes(".pdf");

  return {
    id: purchase.id,
    reference: purchase.reference,
    date: purchase.purchaseDate,
    supplierId: purchase.supplier.id,
    product: {
      id: purchase.id,
      name: purchase.productName,
      sku: purchase.items[0]?.sku ?? `PURCHASE-${purchase.id}`,
      category: purchase.categoryId ? String(purchase.categoryId) : "",
      brand: purchase.brand ?? "Sin marca",
      gender: purchase.gender ?? null,
      variants: purchase.items.map((item) => ({
        id: item.id,
        size: item.size,
        color: item.color,
        quantity: String(item.quantity),
        unitCost: String(item.unitCost),
      })),
    },
    existingInvoice: invoiceUrl
      ? {
          name: `factura-${purchase.reference}.${invoiceIsPdf ? "pdf" : "jpg"}`,
          mimeType: invoiceIsPdf ? "application/pdf" : "image/jpeg",
          url: invoiceUrl,
        }
      : null,
  };
}

export function LocalPurchaseEditor({ id }: LocalPurchaseEditorProps) {
  const [purchase, setPurchase] = useState<EditablePurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const response = await getPurchaseById(id);
        if (!cancelled) setPurchase(toEditablePurchase(response));
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar la compra.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p role="status">Cargando compra...</p>;

  if (!purchase || error) {
    return (
      <section className="rounded-lg border border-[#D9DAE0] bg-white p-8">
        <h1 className="text-2xl font-bold">Compra no encontrada</h1>
        <p className="mt-2 text-[#4A4A4A]">{error || "El registro no existe."}</p>
        <Link href="/compras" className="mt-6 inline-flex rounded-md bg-[#1C21D1] px-5 py-3 font-semibold text-white">
          Volver a compras
        </Link>
      </section>
    );
  }

  return <PurchaseForm mode="edit" initialData={purchase} reference={purchase.reference} />;
}
