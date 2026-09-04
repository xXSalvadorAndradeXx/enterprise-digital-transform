"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MapPin, PackageCheck } from "lucide-react";
import { getOrder, updateOrderStatus } from "@/services/orders/orders.service";
import type { AdminOrderDetail, OrderStatus } from "@/types/orders";
import { statusColors } from "@/constants/order-status";

const labels: Record<OrderStatus, string> = { NEW: "Nuevo", PENDING: "Pendiente", ON_ROUTE: "En ruta", READY_FOR_PICKUP: "Listo para retirar", DELIVERED: "Entregado", CANCELLED: "Cancelado" };

const money = (value: string | number) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(value));
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("es-SV", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "No disponible";
const deliveryLabel = (value?: string) => value === "HOME_DELIVERY" ? "Entrega a domicilio" : "Retiro en tienda";
const paymentLabel = (value?: string | null) => value === "CARD" ? "Pago con tarjeta" : value === "PAY_AT_STORE" ? "Pago en local" : "No disponible";

function getAvailableStatuses(
  deliveryType?: string,
): OrderStatus[] {
  const isHomeDelivery = deliveryType === "HOME_DELIVERY";

  return isHomeDelivery
    ? ["NEW", "PENDING", "ON_ROUTE", "DELIVERED", "CANCELLED"]
    : ["NEW", "PENDING", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED"];
}

export default function VentaDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("NEW");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await getOrder(orderNumber); setOrder(data); setSelectedStatus(data.status); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo cargar la venta."); }
    finally { setLoading(false); }
  }, [orderNumber]);

  useEffect(() => { void load(); }, [load]);

  async function saveStatus() {
    if (!order || selectedStatus === order.status) return;
    setSaving(true); setError(null);
    try { await updateOrderStatus(order.orderNumber, selectedStatus); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo actualizar el estado."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="grid min-h-96 place-items-center text-slate-500">Cargando detalle de venta...</div>;
  if (!order) return <div className="grid min-h-96 place-items-center text-center"><div><p className="text-lg font-semibold text-red-600">{error || "Pedido no encontrado"}</p><Link href="/pedidos" className="mt-5 inline-block text-[#2424DF] underline">Volver a Ventas</Link></div></div>;

  const address = order.delivery?.deliveryType === "HOME_DELIVERY"
    ? [order.delivery.addressLine, order.delivery.city, order.delivery.districtName, order.delivery.departmentName].filter(Boolean).join(", ")
    : [order.delivery?.branchName, order.delivery?.branchAddress].filter(Boolean).join(" — ");
  const availableStatuses = getAvailableStatuses(
    order.delivery?.deliveryType,
  );

  return (
    <main className="space-y-6 pb-12 text-[#4A4A4A]">
      <Link href="/pedidos" className="inline-flex items-center gap-2 text-sm text-[#4A4A4A] hover:text-[#2424DF]"><ArrowLeft size={17} /> Volver a Ventas</Link>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#4A4A4A]">Detalles del pedido #{order.orderNumber}</h1>
        <div className="flex flex-wrap gap-3"><select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)} style={statusColors[selectedStatus]} className="h-12 min-w-52 rounded-lg border border-slate-400 px-4 font-medium">{availableStatuses.map((status) => <option key={status} value={status} style={{ backgroundColor: "#FFFFFF", color: statusColors[status].color }}>{labels[status]}</option>)}</select><button disabled={saving || selectedStatus === order.status} onClick={saveStatus} className="h-12 rounded-lg bg-[#2424DF] px-6 font-semibold text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button></div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-xl bg-blue-50 p-5"><h2 className="mb-4 font-semibold">Información de compra</h2><dl className="space-y-3 text-sm"><Info label="ID Pedido" value={order.orderNumber} /><Info label="Fecha de compra" value={date(order.createdAt)} /><Info label="Método de pago" value={paymentLabel(order.payment?.method)} /><Info label="Método de envío" value={deliveryLabel(order.delivery?.deliveryType)} /><Info label="Total a pagar" value={money(order.totalAmount)} /></dl></section>
          <section className="rounded-xl bg-blue-50 p-5"><h2 className="mb-4 font-semibold">Cliente</h2><dl className="space-y-3 text-sm"><Info label="Cliente" value={order.buyer.fullName} /><Info label="Número de identidad" value={order.buyer.dui || "No registrado"} /><Info label="Correo" value={order.buyer.email || "No disponible"} /><Info label="Teléfono" value={order.buyer.phone || "No disponible"} /><Info label="Cuenta registrada" value={order.customerType === "REGISTERED" ? date(order.buyer.registeredAt) : "No registrada"} /></dl><div className="mt-5 border-t border-blue-200 pt-4"><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><MapPin size={14} /> Entrega</p><p className="text-sm leading-6">{address || "Sin dirección registrada"}</p></div></section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-xl bg-slate-50 p-6"><h2 className="mb-5 text-xl font-semibold">Productos comprados</h2><div className="overflow-x-auto rounded-lg border border-slate-300 bg-white"><table className="w-full min-w-[700px] text-sm"><thead className="border-b bg-slate-50 text-left"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Variante</th><th className="px-4 py-3 text-center">Cantidad</th><th className="px-4 py-3 text-right">Precio unitario</th><th className="px-4 py-3 text-right">Precio total</th></tr></thead><tbody>{order.items.map((item) => { const image = [...(item.product?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.imageUrl; return <tr key={item.id} className="border-b"><td className="px-4 py-3"><div className="flex items-center gap-3">{image ? <img src={image} alt="" className="size-12 rounded bg-slate-100 object-contain" /> : <span className="grid size-12 place-items-center rounded bg-slate-100"><PackageCheck size={20} /></span>}<span className="font-medium">{item.product?.commercialName || "Producto no disponible"}</span></div></td><td className="px-4 py-3">{item.sku || "—"}</td><td className="px-4 py-3">{[item.size, item.color].filter(Boolean).join(" / ") || "Única"}</td><td className="px-4 py-3 text-center">{item.quantity}</td><td className="px-4 py-3 text-right">{money(item.unitPrice)}</td><td className="px-4 py-3 text-right font-semibold">{money(item.subtotal)}</td></tr>; })}</tbody></table></div><div className="ml-auto mt-5 max-w-xs space-y-2 text-sm"><Total label="Subtotal" value={order.subtotal} /><Total label="Descuento" value={`-${money(order.discountTotal)}`} raw /><Total label="Envío" value={order.deliveryCost} /><div className="border-t border-slate-400 pt-3"><Total label="Total a pagar" value={order.totalAmount} strong /></div></div></section>
          <section aria-label="Documento" className="rounded-xl bg-slate-50 p-6">
            <h2 className="mb-3 w-fit border-b border-[#4A4A4A] px-2 pb-1 text-sm font-medium text-[#4A4A4A]">Documento</h2>
            <div className="overflow-hidden rounded-lg border border-slate-400 bg-white">
              <table className="w-full table-fixed text-sm text-[#4A4A4A]">
                <thead className="border-b border-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Documento</th>
                    <th className="px-4 py-3 text-left font-medium">Número</th>
                    <th className="px-4 py-3 text-left font-medium">Cantidad</th>
                    <th className="px-4 py-3 text-left font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="h-16 px-4 text-center text-xs text-[#4A4A4A]">
                      No hay ningún documento disponible
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#4A4A4A]">{label}</dt><dd className="mt-1 break-words text-[#4A4A4A]">{value}</dd></div>; }
function Total({ label, value, strong = false, raw = false }: { label: string; value: string; strong?: boolean; raw?: boolean }) { return <div className={`flex justify-between gap-4 ${strong ? "text-base font-bold" : ""}`}><span>{label}</span><span>{raw ? value : money(value)}</span></div>; }
