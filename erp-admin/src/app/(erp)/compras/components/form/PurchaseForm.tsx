"use client";

import { CalendarDays, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { FileUploadInput } from "./FileUploadInput";
import {
  createInitialNewProductDraft,
  NewProductForm,
  type NewProductDraft,
} from "./NewProductForm";
import { PurchaseSuccessModal } from "./PurchaseSuccessModal";
import {
  INITIAL_RESTOCK_DRAFT,
  RestockProductForm,
  type RestockDraft,
} from "./RestockProductForm";
import { Tabs, type TabItem } from "./Tabs";

type PurchaseTab = "new-product" | "restock-product";

const PURCHASE_TABS: readonly TabItem<PurchaseTab>[] = [
  { value: "new-product", label: "Nuevo producto" },
  { value: "restock-product", label: "Reabastecer producto" },
];

function getLocalDate(): string {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

export function PurchaseForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PurchaseTab>("new-product");
  const [purchaseDate, setPurchaseDate] = useState(getLocalDate);
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [newProduct, setNewProduct] = useState<NewProductDraft>(createInitialNewProductDraft);
  const [restock, setRestock] = useState<RestockDraft>(INITIAL_RESTOCK_DRAFT);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState("");
  const sequenceRef = useRef(5);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleInvoiceChange = (file: File | null) => {
    setInvoice(file);
    if (file) setInvoiceError("");
  };

  const handleAddPurchase = () => {
    if (activeTab === "new-product" && !invoice) {
      setInvoiceError("*Por favor, adjunta tu factura.");
      return;
    }

    // Número temporal para demostración de TASK 686.
    // Reemplazar por el número devuelto por Backend.
    setPurchaseNumber(`CP-${String(sequenceRef.current).padStart(4, "0")}`);
    sequenceRef.current += 1;
    setModalOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1035px] min-w-0 text-[#202124]">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-[#D9DAE0] bg-white px-5 py-5 sm:px-7">
        <h1 className="font-[var(--font-title)] text-[32px] leading-10 font-bold">
          Nueva Compra
        </h1>
        <button
          type="button"
          onClick={() => router.push("/compras")}
          className="inline-flex h-11 items-center gap-2 rounded-[5px] border border-[#1C21D1] bg-white px-5 font-semibold text-[#202124] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
        >
          <ChevronLeft aria-hidden="true" size={20} />
          Volver
        </button>
      </header>

      <div className="mt-4 grid gap-6 rounded-[6px] border border-[#D9DAE0] bg-white px-5 py-5 sm:px-7 sm:py-6 md:grid-cols-2 md:gap-10">
          <div>
            <label htmlFor="purchase-date" className="mb-2 block text-sm font-medium">
              Fecha de compra
            </label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A4A]"
              />
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                className="h-11 w-full rounded-[5px] border border-[#878A92] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1] [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
            </div>
          </div>
          <div>
            <label htmlFor="purchase-supplier" className="mb-2 block text-sm font-medium">
              Seleccionar proveedor
            </label>
            <select
              id="purchase-supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="h-11 w-full max-w-[360px] rounded-[5px] border border-[#878A92] bg-white px-3 text-sm outline-none focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
            >
              {/* Datos exclusivamente visuales para TASK 686.
                  Retirar cuando Backend exponga el contrato real de proveedores. */}
              <option value="">Proveedor</option>
              <option value="global">Distribuidora global</option>
              <option value="local">Proveedor local</option>
            </select>
          </div>
      </div>

      <div className="mt-4">
        <Tabs
          items={PURCHASE_TABS}
          value={activeTab}
          onValueChange={setActiveTab}
          ariaLabel="Tipo de compra"
          className="rounded-t-[6px]"
        />

        <div className="mt-2 rounded-[6px] border border-[#B8CBEA] bg-white">
          <div
            role="tabpanel"
            aria-label={PURCHASE_TABS.find((tab) => tab.value === activeTab)?.label}
            className="px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7"
          >
            {activeTab === "new-product" ? (
              <NewProductForm value={newProduct} onChange={setNewProduct} />
            ) : (
              <RestockProductForm value={restock} onChange={setRestock} />
            )}
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
          {activeTab === "new-product" && (
            <FileUploadInput
              id="purchase-invoice"
              label="Subir factura"
              file={invoice}
              onFileChange={handleInvoiceChange}
              error={invoiceError}
            />
          )}

          <div
            className={`flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4 ${
              activeTab === "new-product" ? "mt-6" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => router.push("/compras")}
              className="h-11 rounded-[5px] border border-[#1C21D1] bg-white px-7 font-semibold text-[#202124] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] sm:min-w-32"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddPurchase}
              className="h-11 rounded-[5px] bg-[#1C21D1] px-7 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] sm:min-w-40"
            >
              Agregar compra
            </button>
          </div>
        </div>
      </div>
      </div>

      <PurchaseSuccessModal
        open={modalOpen}
        purchaseNumber={purchaseNumber}
        onAccept={closeModal}
      />
    </div>
  );
}
