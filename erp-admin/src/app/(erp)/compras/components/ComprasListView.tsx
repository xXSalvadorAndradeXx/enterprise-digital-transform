"use client";

import { useState } from "react";
import { Inbox, Pencil, Plus, Trash2 } from "lucide-react";

import {
  EmptyState,
  InvoiceThumbnail,
  Pagination,
  SearchBar,
  Table,
  type TableColumn,
} from "./index";

type PurchaseListRow = {
  id: string;
  date: string;
  supplier: string;
  product: string;
  total: string;
  stockEntered: number;
  invoiceUrl: string;
  invoiceType: "image" | "pdf";
};

// Datos temporales exclusivamente visuales; serán reemplazados por la integración de TASK 684.
const TEMPORARY_PRESENTATION_ROWS: readonly PurchaseListRow[] = [
  {
    id: "001",
    date: "18-05-2026",
    supplier: "Nike",
    product: "nike ford",
    total: "$309.50",
    stockEntered: 100,
    invoiceUrl: "",
    invoiceType: "pdf",
  },
  {
    id: "002",
    date: "18-05-2026",
    supplier: "Nike",
    product: "nike low 1",
    total: "$105.50",
    stockEntered: 90,
    invoiceUrl: "",
    invoiceType: "pdf",
  },
];

const columns: readonly TableColumn<PurchaseListRow>[] = [
  {
    id: "id",
    header: "id",
    className: "w-[14.7%]",
    render: (row) => row.id,
  },
  {
    id: "date",
    header: "Fecha",
    className: "w-[12.7%]",
    render: (row) => row.date,
  },
  {
    id: "supplier",
    header: "Proveedor",
    className: "w-[11.8%] whitespace-normal break-words",
    render: (row) => row.supplier,
  },
  {
    id: "product",
    header: "producto",
    className: "w-[15.1%] whitespace-normal break-words",
    render: (row) => row.product,
  },
  {
    id: "total",
    header: "Total",
    align: "center",
    className: "w-[9.9%]",
    render: (row) => row.total,
  },
  {
    id: "stockEntered",
    header: "stock ingresado",
    align: "center",
    className: "w-[14%]",
    render: (row) => row.stockEntered,
  },
  {
    id: "invoice",
    header: "Factura",
    align: "center",
    className: "w-[10.7%]",
    render: (row) => (
      <InvoiceThumbnail
        src={row.invoiceUrl}
        alt={`Factura de la compra ${row.id}`}
        fileType={row.invoiceType}
        className="mx-auto"
      />
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    align: "center",
    className: "w-[11.1%]",
    render: (row) => (
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={`Editar compra ${row.id}`}
          className="rounded p-1 text-[#4A4A4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A4A4A]"
        >
          <Pencil aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={`Eliminar compra ${row.id}`}
          className="rounded p-1 text-[#F44336] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F44336]"
        >
          <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </div>
    ),
  },
];

const presentationOnlyAction = () => undefined;

export interface ComprasListViewProps {
  showEmptyState?: boolean;
}

export default function ComprasListView({
  showEmptyState = false,
}: ComprasListViewProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const hasRows = !showEmptyState && TEMPORARY_PRESENTATION_ROWS.length > 0;

  return (
    <div className="w-full max-w-[1035px] min-w-0 text-black">
      <header>
        <h1 className="mb-0.5 font-[var(--font-title)] text-[32px] leading-10 font-bold">
          Compras a proveedores
        </h1>
        <p className="text-[18px] leading-[27px] text-[#4A4A4A]">
          Gestiona y visualiza la información de tus compras.
        </p>
      </header>

      {hasRows ? (
        <section className="mt-4 flex min-h-[445px] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-[#878A92] bg-white">
          <div className="flex h-[89px] flex-wrap items-center gap-4 px-[14px] py-[23px]">
            <button
              type="button"
              className="inline-flex h-10 w-[161px] min-w-[161px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#1C21D1] px-4 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
            >
              Agregar compra
            </button>
            <SearchBar
              value={searchValue}
              placeholder="Buscar proveedor"
              onChange={setSearchValue}
              className="!h-10 w-full !border-[#1C21D1] sm:w-[243px] sm:flex-none"
            />
          </div>

          <Table
            columns={columns}
            data={TEMPORARY_PRESENTATION_ROWS}
            getRowKey={(row) => row.id}
          />

          <div className="mt-auto flex justify-end px-5 pt-3 pb-[21px]">
            <Pagination
              currentPage={currentPage}
              totalPages={24}
              onPageChange={setCurrentPage}
            />
          </div>
        </section>
      ) : (
        <section className="mt-8 min-w-0">
          <SearchBar
            value={searchValue}
            placeholder="Buscar Compras"
            onChange={setSearchValue}
            className="!h-[46px] w-full max-w-full shrink-0 !gap-2.5 !rounded-[6px] !border-[#777777] !px-4 sm:!w-[379px] sm:!max-w-[379px] sm:flex-none"
          />
          <EmptyState
            icon={<Inbox />}
            title="No hay compras aún"
            description="Cuando agregues alguna compra, apareceran aquí."
            infoMessage="Puedes agregar tu primera compra para comenzar."
            actionLabel="Agregar compra"
            actionIcon={<Plus />}
            onAction={presentationOnlyAction}
            className="pt-9 pb-10"
          />
        </section>
      )}
    </div>
  );
}
