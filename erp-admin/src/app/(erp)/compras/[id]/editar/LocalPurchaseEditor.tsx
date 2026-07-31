"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { PurchaseForm } from "../../components/form";
import {
  getLocalPurchasesServerSnapshot,
  getLocalPurchasesSnapshot,
  subscribeToLocalPurchases,
} from "../../data/localPurchases";
import type { EditablePurchase } from "../../types/purchaseEdit.types";

type LocalPurchaseEditorProps = {
  id: string;
};

function toIsoDate(value: string): string {
  const [day, month, year] = value.split("-");
  return day && month && year ? `${year}-${month}-${day}` : value;
}

function toEditablePurchase(
  row: ReturnType<typeof getLocalPurchasesSnapshot>[number],
): EditablePurchase {
  const details = row.editDetails;
  const numericTotal = Number(row.total.replace(/[^0-9.-]/g, ""));
  const unitCost =
    row.stockEntered > 0 && Number.isFinite(numericTotal)
      ? numericTotal / row.stockEntered
      : 0;

  return {
    id: row.id,
    reference: row.reference,
    date: details?.purchaseDate ?? toIsoDate(row.date),
    // El nombre funciona como respaldo para registros creados antes del detalle.
    supplierId: details?.supplierId ?? row.supplier,
    product: {
      id: details?.productId ?? `local-product-${row.id}`,
      name: row.product,
      sku: details?.productSku ?? `LOCAL-${row.id}`,
      category: details?.category ?? "fashion",
      variants:
        details?.variants ?? [
          {
            id: `local-${row.id}-variant`,
            size: "Única",
            quantity: String(row.stockEntered),
            unitCost: unitCost.toFixed(2),
          },
        ],
    },
    existingInvoice: {
      name: `factura-${row.reference}.pdf`,
      mimeType: "application/pdf",
      url: "data:application/pdf;base64,JVBERi0xLjQKJSVFT0Y=",
    },
  };
}

export function LocalPurchaseEditor({ id }: LocalPurchaseEditorProps) {
  const purchases = useSyncExternalStore(
    subscribeToLocalPurchases,
    getLocalPurchasesSnapshot,
    getLocalPurchasesServerSnapshot,
  );
  const row = purchases.find((purchase) => purchase.id === id);

  if (!row) {
    return (
      <section className="rounded-lg border border-[#D9DAE0] bg-white p-8">
        <h1 className="text-2xl font-bold">Compra no encontrada</h1>
        <p className="mt-2 text-[#4A4A4A]">
          El registro mock no existe o fue eliminado del almacenamiento local.
        </p>
        <Link
          href="/compras"
          className="mt-6 inline-flex rounded-md bg-[#1C21D1] px-5 py-3 font-semibold text-white"
        >
          Volver a compras
        </Link>
      </section>
    );
  }

  const purchase = toEditablePurchase(row);

  return (
    <PurchaseForm
      mode="edit"
      initialData={purchase}
      reference={purchase.reference}
    />
  );
}
