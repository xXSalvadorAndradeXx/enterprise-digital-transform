"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock3, PackageCheck, Search, Sparkles, Store, Truck } from "lucide-react";
import { listOrders } from "@/services/orders/orders.service";
import type { AdminOrderListItem, AdminOrdersResponse, OrderStatus } from "@/types/orders";

const statusLabels: Record<OrderStatus, string> = { NEW: "Nuevo", PENDING: "Pendiente", ON_ROUTE: "En ruta", READY_FOR_PICKUP: "Listo para retirar", DELIVERED: "Entregado", CANCELLED: "Cancelado" };
const deliveryLabels: Record<string, string> = { HOME_DELIVERY: "Entrega a domicilio", STORE_PICKUP: "Retiro en tienda", PICKUP: "Retiro en tienda" };

function formatMoney(value: string): string { return new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(value)); }
function formatDate(value: string): string { return new Intl.DateTimeFormat("es-SV", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
function DeliveryIcon({ type }: { type: string }) { return type === "HOME_DELIVERY" ? <Truck size={15} /> : <Store size={15} />; }

export default function VentasPage() {
  const [result, setResult] = useState<AdminOrdersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      setResult(await listOrders(params));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudieron cargar las ventas."); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { const timeout = window.setTimeout(load, 250); return () => window.clearTimeout(timeout); }, [load]);
  const summary = result?.summary ?? { newOrders: 0, inProcess: 0, onRoute: 0 };

  return (
    <main className="space-y-8 pb-10 text-[#4A4A4A]">
      <h1 className="text-4xl font-bold text-[#4A4A4A]">Ventas</h1>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Nuevos pedidos", value: summary.newOrders, icon: Sparkles, iconClass: "bg-blue-100 text-blue-700" },
          { label: "En proceso", value: summary.inProcess, icon: Clock3, iconClass: "bg-amber-100 text-amber-600" },
          { label: "Pedidos en ruta", value: summary.onRoute, icon: PackageCheck, iconClass: "bg-emerald-100 text-emerald-600" },
        ].map((card) => <article key={card.label} className="flex items-center gap-4 rounded-2xl border border-slate-300 bg-white px-6 py-5"><span className={`grid size-11 place-items-center rounded-full ${card.iconClass}`}><card.icon size={22} /></span><div><p className="text-base text-[#4A4A4A]">{card.label}</p><p className="text-2xl font-bold text-[#4A4A4A]">{card.value}</p></div></article>)}
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-300 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Pedidos</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-400 bg-white px-4 text-sm text-[#4A4A4A]"><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <label className="flex h-11 min-w-64 items-center gap-2 rounded-lg border border-blue-500 px-3"><Search size={18} className="text-[#4A4A4A]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar pedido o cliente" className="w-full text-[#4A4A4A] outline-none placeholder:text-[#4A4A4A]" /></label>
          </div>
        </div>
        {error ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><p className="text-lg font-semibold text-red-600">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-[#2424DF] px-6 py-3 font-semibold text-white">Reintentar</button></div></div>
          : loading ? <div className="grid min-h-72 place-items-center text-slate-500">Cargando ventas...</div>
          : !result?.items.length ? <div className="grid min-h-72 place-items-center text-center"><div><PackageCheck className="mx-auto mb-3 text-slate-400" size={42} /><p className="text-lg font-semibold">No hay pedidos para mostrar</p></div></div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="border-b border-slate-300 bg-slate-50 text-left"><tr>{["ID", "Cliente", "Fecha", "Total", "Entrega", "Estado", "Estado de registro"].map((heading) => <th key={heading} className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead><tbody>{result.items.map((order: AdminOrderListItem) => <tr key={order.id} className="border-b border-slate-200 hover:bg-blue-50/50"><td className="px-5 py-4"><Link className="font-semibold text-[#1717B8] hover:underline" href={`/pedidos/${order.orderNumber}`}>#{order.orderNumber}</Link></td><td className="px-5 py-4"><p className="font-medium">{order.customerName}</p><p className="text-xs text-slate-500">{order.customerEmail}</p></td><td className="px-5 py-4">{formatDate(order.createdAt)}</td><td className="px-5 py-4 font-medium">{formatMoney(order.total)}</td><td className="px-5 py-4"><span className="flex items-center gap-2"><DeliveryIcon type={order.deliveryType} />{deliveryLabels[order.deliveryType] ?? order.deliveryType}</span></td><td className="px-5 py-4">{statusLabels[order.status]}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${order.customerType === "REGISTERED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{order.customerType === "REGISTERED" ? "Registrado" : "No registrado"}</span></td></tr>)}</tbody></table></div>}
        {result && result.meta.totalPages > 1 && <div className="flex items-center justify-end gap-3 px-5 py-4"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-2 disabled:opacity-40">‹</button><span className="text-sm">Página {page} de {result.meta.totalPages}</span><button disabled={page >= result.meta.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-2 disabled:opacity-40">›</button></div>}
      </section>
    </main>
  );
}
