"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Fragment, useState } from "react";

import type { UseInventoryReturn } from "../hooks/useInventory";
import { InventoryStatus, StockStatus, type InventoryDetailDto } from "../types";

interface InventoryTableProps {
  inventory: UseInventoryReturn;
}

const INVENTORY_STATUS = {
  [InventoryStatus.ACTIVE]: {
    label: "ALTO",
    className: "bg-[#D9F4D8] text-[#35A849]",
  },
  [InventoryStatus.LOW_STOCK]: {
    label: "BAJO",
    className: "bg-[#FADDDD] text-[#F04444]",
  },
  [InventoryStatus.OUT_OF_STOCK]: {
    label: "BAJO",
    className: "bg-[#FADDDD] text-[#F04444]",
  },
} as const;

const DETAIL_STATUS = {
  [StockStatus.ALTO]: "bg-[#CBEBCD] text-[#35A849]",
  [StockStatus.MEDIO]: "bg-[#FFF1CB] text-[#E7A515]",
  [StockStatus.BAJO]: "bg-[#FADDDD] text-[#F04444]",
} as const;

export default function InventoryTable({ inventory }: InventoryTableProps) {
  const {
    query,
    updateQuery,
    items,
    meta,
    loading,
    error,
    retry,
    loadVariants,
  } = inventory;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [variants, setVariants] = useState<
    Record<string, readonly InventoryDetailDto[]>
  >({});
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);

  const toggleRow = async (id: string): Promise<void> => {
    if (expandedRows.has(id)) {
      setExpandedRows((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      return;
    }

    if (!variants[id]) {
      setLoadingRowId(id);

      try {
        const data = await loadVariants(id);
        setVariants((current) => ({ ...current, [id]: data }));
      } finally {
        setLoadingRowId(null);
      }
    }

    setExpandedRows((current) => new Set(current).add(id));
  };

  if (loading) {
    return <div className="p-8 text-center text-[#6B7280]">Cargando inventario...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-[#F04444]">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-md bg-[#2924D9] px-4 py-2 font-medium text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-[#6B7280]">
        {query.search ? "No se encontraron resultados." : "No hay registros."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-[#AEB4BF] overscroll-x-contain">
      <table className="w-full min-w-[860px] table-fixed border-collapse">
        <thead className="bg-[#EFEEFF]">
          <tr className="h-10 text-[13px] font-medium text-[#232323]">
            <th className="w-14 text-center" aria-label="Desplegar detalle">↕</th>
            <th className="w-[12%] text-left">ID</th>
            <th className="w-[18%] text-left">Producto</th>
            <th className="w-[17%] text-left">Proveedor</th>
            <th className="w-[15%] text-left">Fecha</th>
            <th className="w-[12%] text-left">Precio</th>
            <th className="w-[14%] text-center">Status</th>
            <th className="w-[10%] text-center">Stock</th>
          </tr>
        </thead>

        <tbody className="bg-white text-[13px] text-[#252525]">
          {items.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            const status = INVENTORY_STATUS[item.status];
            const itemVariants = variants[item.id] ?? [];
            const variantsCost = variants[item.id]?.reduce(
              (total, variant) => total + variant.stock * variant.unitCost,
              0,
            );
            const totalCost = Number.isFinite(item.totalInventoryCost)
              ? item.totalInventoryCost
              : variantsCost;

            return (
              <Fragment key={item.id}>
                <tr className="h-[58px] border-t border-[#F0F0F0]">
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => void toggleRow(item.id)}
                      disabled={loadingRowId === item.id}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} variantes de ${item.productName}`}
                      className="mx-auto grid size-5 place-items-center rounded-[4px] border border-[#91BEFF] bg-[#DCEAFF] text-[#6CA8FF] transition hover:bg-[#CDE1FF] disabled:opacity-50"
                    >
                      {isExpanded ? (
                        <ChevronUp aria-hidden="true" size={14} strokeWidth={2} />
                      ) : (
                        <ChevronDown aria-hidden="true" size={14} strokeWidth={2} />
                      )}
                    </button>
                  </td>

                  <td className="truncate pr-3" title={item.id}>
                    #{item.id.slice(0, 5).toUpperCase()}
                  </td>
                  <td className="truncate pr-4" title={item.productName}>
                    {item.productName}
                  </td>
                  <td className="truncate pr-4" title={item.supplier?.name}>
                    {item.supplier?.name ?? "Sin proveedor"}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString("es-SV")}</td>
                  <td>
                    {typeof totalCost === "number"
                      ? `$${totalCost.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="text-center">
                    <span
                      className={`inline-flex min-w-24 justify-center rounded-md px-4 py-1 text-xs ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="text-center">{item.totalStock}</td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={8} className="px-[52px] pb-3">
                      <div className="overflow-hidden border-t border-[#9EA6B2] bg-[#F0EFFF]">
                        <table className="w-full table-fixed border-collapse">
                          <thead>
                            <tr className="h-9 text-xs font-medium text-[#303030]">
                              <th className="w-[20%] px-7 text-left">Talla</th>
                              <th className="w-[24%] px-7 text-left">SKU</th>
                              <th className="w-[18%] px-7 text-left">STOCK</th>
                              <th className="w-[20%] px-7 text-left">Costo uni.</th>
                              <th className="w-[18%] px-7 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemVariants.length > 0 ? (
                              itemVariants.map((variant) => (
                                <tr
                                  key={variant.id}
                                  className="h-9 border-t border-white/70 text-xs"
                                >
                                  <td className="px-7">{variant.size}</td>
                                  <td className="truncate px-7" title={variant.sku}>
                                    {variant.sku}
                                  </td>
                                  <td className="px-7">{variant.stock}</td>
                                  <td className="px-7">${variant.unitCost.toFixed(2)}</td>
                                  <td className="px-7 text-center">
                                    <span
                                      className={`inline-flex w-full max-w-[180px] justify-center rounded-md px-4 py-1 ${DETAIL_STATUS[variant.stockStatus]}`}
                                    >
                                      {variant.stockStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="h-12 text-center text-[#6B7280]">
                                  Este producto no tiene variantes registradas.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <div className="sticky left-0 flex min-h-20 w-[calc(100vw-2rem)] max-w-full items-end justify-center gap-2 px-3 pb-4 text-sm text-[#202020] sm:min-h-24 sm:justify-end sm:gap-4 sm:px-6">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => updateQuery({ page: meta.page - 1 })}
          className="grid size-8 place-items-center disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>

        {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              type="button"
              key={page}
              onClick={() => updateQuery({ page })}
              aria-current={meta.page === page ? "page" : undefined}
              className={`grid size-8 place-items-center rounded-md ${
                meta.page === page ? "bg-[#F6F6F8] font-medium" : ""
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => updateQuery({ page: meta.page + 1 })}
          className="grid size-8 place-items-center disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Página siguiente"
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
