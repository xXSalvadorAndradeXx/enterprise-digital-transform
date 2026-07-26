"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  EmptyState,
  DeletePurchaseConfirmModal,
  DeletePurchaseSuccessModal,
  InvoiceThumbnail,
  Pagination,
  SearchBar,
  Table,
  type TableColumn,
} from "./index";

type PurchaseListRow = {
  id: string;
  reference: string;
  date: string;
  supplier: string;
  product: string;
  total: string;
  stockEntered: number;
  invoiceUrl: string;
  invoiceType: "image" | "pdf";
};

const SEARCH_DEBOUNCE_MS = 300;

// Tamaño temporal para la paginación local; TASK 684 lo sustituirá con datos reales.
const LOCAL_PAGE_SIZE = 2;

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"]);

const normalizeSearchTerm = (value: string) => value.trim().toLocaleLowerCase();

function resolveInvoiceType(row: PurchaseListRow): "pdf" | "image" {
  const cleanUrl = row.invoiceUrl.split(/[?#]/, 1)[0].toLocaleLowerCase();

  if (cleanUrl.endsWith(".pdf")) return "pdf";
  if ([...IMAGE_EXTENSIONS].some((extension) => cleanUrl.endsWith(extension))) return "image";

  return row.invoiceType;
}

// Datos temporales exclusivamente visuales; serán reemplazados por la integración de TASK 684.
const TEMPORARY_PRESENTATION_ROWS: readonly PurchaseListRow[] = [
  {
    id: "001",
    reference: "CP-0005",
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
    reference: "CP-0006",
    date: "18-05-2026",
    supplier: "Nike",
    product: "nike low 1",
    total: "$105.50",
    stockEntered: 90,
    invoiceUrl: "",
    invoiceType: "pdf",
  },
];

function createColumns(
  onDelete: (row: PurchaseListRow, trigger: HTMLButtonElement) => void,
): readonly TableColumn<PurchaseListRow>[] {
  return [
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
        fileType={resolveInvoiceType(row)}
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
        <Link
          href={`/compras/${encodeURIComponent(row.id)}/editar`}
          aria-label={`Editar compra ${row.id}`}
          className="rounded p-1 text-[#4A4A4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A4A4A]"
        >
          <Pencil aria-hidden="true" size={20} strokeWidth={2} />
        </Link>
        <button
          type="button"
          aria-label={`Eliminar compra ${row.reference}`}
          onClick={(event) => onDelete(row, event.currentTarget)}
          className="rounded p-1 text-[#F44336] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F44336]"
        >
          <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </div>
    ),
  },
  ];
}

export interface ComprasListViewProps {
  showEmptyState?: boolean;
}

export default function ComprasListView({
  showEmptyState = false,
}: ComprasListViewProps) {
  const router = useRouter();
  // Simulación local temporal: al recargar se restauran los mocks.
  const [rows, setRows] = useState<PurchaseListRow[]>(() => [
    ...TEMPORARY_PRESENTATION_ROWS,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseListRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteTrigger, setDeleteTrigger] =
    useState<HTMLButtonElement | null>(null);

  const openDeleteConfirmation = useCallback(
    (row: PurchaseListRow, trigger: HTMLButtonElement) => {
      setDeleteTrigger(trigger);
      setSelectedPurchase(row);
      setConfirmOpen(true);
    },
    [],
  );

  const closeDeleteConfirmation = useCallback(() => {
    setConfirmOpen(false);
    setSelectedPurchase(null);
  }, []);

  const confirmLocalDelete = useCallback(() => {
    if (!selectedPurchase) return;
    setRows((current) =>
      current.filter((row) => row.id !== selectedPurchase.id),
    );
    setConfirmOpen(false);
    setSelectedPurchase(null);
    setSuccessOpen(true);
  }, [selectedPurchase]);

  const closeDeleteSuccess = useCallback(() => {
    setSuccessOpen(false);
    setDeleteTrigger(null);
  }, []);
  const columns = useMemo(
    () => createColumns(openDeleteConfirmation),
    [openDeleteConfirmation],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const normalizedSearchTerm = useMemo(
    () => normalizeSearchTerm(debouncedSearchValue),
    [debouncedSearchValue],
  );

  const filteredRows = useMemo(() => {
    if (!normalizedSearchTerm) return rows;

    return rows.filter(
      (row) =>
        normalizeSearchTerm(row.id).includes(normalizedSearchTerm) ||
        normalizeSearchTerm(row.supplier).includes(normalizedSearchTerm),
    );
  }, [normalizedSearchTerm, rows]);

  const totalPages = Math.ceil(filteredRows.length / LOCAL_PAGE_SIZE);
  const validCurrentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * LOCAL_PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + LOCAL_PAGE_SIZE);
  }, [filteredRows, validCurrentPage]);

  const hasRows = !showEmptyState && filteredRows.length > 0;

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
              onClick={() => router.push("/compras/nueva")}
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
            data={paginatedRows}
            getRowKey={(row) => row.id}
          />

          <div className="mt-auto flex justify-end px-5 pt-3 pb-[21px]">
            <Pagination
              currentPage={validCurrentPage}
              totalPages={totalPages}
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
            onAction={() => router.push("/compras/nueva")}
            className="pt-9 pb-10"
          />
        </section>
      )}
      <DeletePurchaseConfirmModal
        open={confirmOpen}
        reference={selectedPurchase?.reference ?? ""}
        returnFocusTo={deleteTrigger}
        onCancel={closeDeleteConfirmation}
        onConfirm={confirmLocalDelete}
      />
      <DeletePurchaseSuccessModal
        open={successOpen}
        onClose={closeDeleteSuccess}
      />
    </div>
  );
}
