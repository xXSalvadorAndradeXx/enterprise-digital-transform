"use client";

import { Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PurchaseResponse, PurchasesPaginationMetadata } from "../types/purchases.types";
import { deletePurchase, getPurchases } from "../services/purchases.service";
import { DeletePurchaseConfirmModal, DeletePurchaseSuccessModal, EmptyState, InvoiceThumbnail, Pagination, SearchBar, Table, type TableColumn } from "./index";

const PAGE_SIZE = 4;
const formatMoney = (value: number) => value.toLocaleString("es-SV", { style: "currency", currency: "USD" });

export interface ComprasListViewProps { showEmptyState?: boolean }

export default function ComprasListView({ showEmptyState = false }: ComprasListViewProps) {
  const router = useRouter();
  const [rows, setRows] = useState<PurchaseResponse[]>([]);
  const [meta, setMeta] = useState<PurchasesPaginationMetadata>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<PurchaseResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteTrigger, setDeleteTrigger] = useState<HTMLButtonElement | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try { const result = await getPurchases({ search: debouncedSearch, page, limit: PAGE_SIZE }, signal); setRows(result.data); setMeta(result.meta); }
    catch (caught) { if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "No se pudieron cargar las compras."); }
    finally { setLoading(false); }
  }, [debouncedSearch, page]);

  useEffect(() => { const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300); return () => clearTimeout(timeout); }, [search]);
  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      // Mantiene la carga dentro de una tarea asíncrona y evita una actualización
      // de estado síncrona durante la ejecución del efecto.
      await Promise.resolve();
      await load(controller.signal);
    })();

    return () => controller.abort();
  }, [load]);

  const columns = useMemo<readonly TableColumn<PurchaseResponse>[]>(() => [
    { id: "id", header: "ID", className: "w-[11%]", render: (row) => row.reference },
    { id: "date", header: "Fecha", className: "w-[12%]", render: (row) => row.purchaseDate },
    { id: "supplier", header: "Proveedor", className: "w-[17%]", render: (row) => <span title={row.supplier.name}>{row.supplier.name}</span> },
    { id: "product", header: "Producto", className: "w-[17%]", render: (row) => <span title={row.productName}>{row.productName}</span> },
    { id: "total", header: "Total", className: "w-[10%]", align: "center", render: (row) => formatMoney(row.totalAmount) },
    { id: "stock", header: "Stock ingresado", className: "w-[10%]", align: "center", render: (row) => row.totalQuantity },
    { id: "invoice", header: "Factura", className: "w-[12%]", align: "center", render: (row) => <InvoiceThumbnail src={row.invoiceUrl} alt={`Factura ${row.reference}`} fileType={row.invoiceUrl.toLowerCase().includes(".pdf") ? "pdf" : "image"} className="mx-auto" /> },
    { id: "actions", header: "Acciones", className: "w-[11%]", align: "center", render: (row) => <div className="flex items-center justify-center gap-3"><button type="button" aria-label={`Editar compra ${row.reference}`} onClick={() => router.push(`/compras/${row.id}/editar`)} className="rounded p-1 text-black transition hover:bg-gray-100"><Pencil aria-hidden="true" size={20} /></button><button type="button" aria-label={`Eliminar compra ${row.reference}`} onClick={(event) => { setDeleteTrigger(event.currentTarget); setSelected(row); setConfirmOpen(true); }} className="rounded p-1 text-red-600 transition hover:bg-red-50"><Trash2 aria-hidden="true" size={20} /></button></div> },
  ], [router]);

  const confirmDelete = async () => { if (!selected) return; try { await deletePurchase(selected.id); setConfirmOpen(false); setSelected(null); setSuccessOpen(true); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo eliminar la compra."); } };
  const hasRows = !showEmptyState && rows.length > 0;

  return <div className="w-full max-w-[1035px] min-w-0 text-black">
    <header><h1 className="font-[var(--font-title)] text-[32px] font-bold">Compras a proveedores</h1><p className="text-[18px] text-[#4A4A4A]">Gestiona y visualiza la información de tus compras.</p></header>
    {error && <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {hasRows || loading ? <section className="mt-4 flex min-h-[445px] flex-col overflow-hidden rounded-lg border border-[#878A92] bg-white">
      <div className="flex flex-wrap items-center gap-4 px-4 py-6"><button type="button" onClick={() => router.push("/compras/nueva")} className="h-10 rounded bg-[#1C21D1] px-5 font-semibold text-white">Agregar compra</button><SearchBar value={search} placeholder="Buscar proveedor o producto" onChange={setSearch} className="!h-10 w-full sm:w-[280px]" /></div>
      {loading ? <p role="status" className="p-8 text-center">Cargando compras...</p> : <Table columns={columns} data={rows} getRowKey={(row) => row.id} />}
      <div className="mt-auto flex justify-end px-5 py-5"><Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} /></div>
    </section> : <section className="mt-8"><SearchBar value={search} placeholder="Buscar compras" onChange={setSearch} className="w-full sm:w-[379px]" /><EmptyState icon={<Inbox />} title="No hay compras aún" description="Cuando agregues una compra, aparecerá aquí." infoMessage="Puedes agregar tu primera compra para comenzar." actionLabel="Agregar compra" actionIcon={<Plus />} onAction={() => router.push("/compras/nueva")} /></section>}
    <DeletePurchaseConfirmModal open={confirmOpen} reference={selected?.reference ?? ""} returnFocusTo={deleteTrigger} onCancel={() => { setConfirmOpen(false); setSelected(null); }} onConfirm={() => void confirmDelete()} />
    <DeletePurchaseSuccessModal open={successOpen} onClose={() => { setSuccessOpen(false); setDeleteTrigger(null); }} />
  </div>;
}
