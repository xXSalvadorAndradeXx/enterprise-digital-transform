"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { getRestockInventoryOptions, getRestockPreview } from "../../services/purchases.service";
import type { RestockInventoryOption, RestockPreviewResponse } from "../../types/purchases.types";
import { SearchBar } from "../SearchBar";
import { RestockTable, type RestockSize } from "./RestockTable";

export type RestockDraft = { search: string; selectedProductId: string; sizes: RestockSize[] };
export type RestockFormErrors = { selectedProductId?: string; sizes?: Record<string, string | undefined>; sizesGeneral?: string };
type Props = { value: RestockDraft; onChange: (value: RestockDraft) => void; errors?: RestockFormErrors };

export function createInitialRestockDraft(): RestockDraft { return { search: "", selectedProductId: "", sizes: [] }; }
export const INITIAL_RESTOCK_DRAFT = createInitialRestockDraft();
function createNewRow(): RestockSize { return { id: `new-${crypto.randomUUID()}`, size: "", color: "", currentStock: 0, quantity: "", unitCost: "", isNew: true }; }

export function RestockProductForm({ value, onChange, errors }: Props) {
  const [options, setOptions] = useState<RestockInventoryOption[]>([]);
  const [preview, setPreview] = useState<RestockPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void getRestockInventoryOptions(value.search).then((data) => { if (!controller.signal.aborted) setOptions(data); }).catch(() => { if (!controller.signal.aborted) setRequestError("No se pudo consultar el inventario."); });
    }, 250);
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [value.search]);

  const selectProduct = async (option: RestockInventoryOption) => {
    setLoading(true); setRequestError("");
    try {
      const result = await getRestockPreview(option.id);
      setPreview(result);
      onChange({ search: option.productName, selectedProductId: option.id, sizes: result.details.map((detail) => ({ id: detail.inventoryDetailId, size: detail.size, color: detail.color, currentStock: detail.currentStock, quantity: "", unitCost: String(detail.currentUnitCost) })) });
    } catch { setRequestError("No se pudo cargar el detalle del producto."); } finally { setLoading(false); }
  };

  const total = value.sizes.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const updateRow = (id: string, field: "size" | "color" | "quantity" | "unitCost", fieldValue: string) => onChange({ ...value, sizes: value.sizes.map((row) => row.id === id ? { ...row, [field]: fieldValue } : row) });

  return (
    <section aria-labelledby="restock-product-title" className="w-full pb-8">
      <h2 id="restock-product-title" className="text-xl font-semibold">Reabastecer producto</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,500px)_210px] lg:justify-between">
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"><span className="text-sm font-medium">Buscar producto:</span><SearchBar value={value.search} placeholder="Buscar en el inventario" ariaLabel="Buscar producto" onChange={(search) => { setPreview(null); onChange({ search, selectedProductId: "", sizes: [] }); }} className="w-full sm:w-[300px]" /></div>
          {!preview && value.search.trim() && <div className="mt-2 max-h-44 overflow-y-auto rounded border bg-white">{options.map((option) => <button key={option.id} type="button" onClick={() => void selectProduct(option)} className="flex w-full justify-between border-b px-3 py-2 text-left text-sm hover:bg-[#F5F7FA]"><span>{option.productName}</span><span className="text-xs text-[#6B6F78]">{option.sku}</span></button>)}</div>}
          {loading && <p role="status" className="mt-2 text-sm">Cargando producto...</p>}
          {(requestError || errors?.selectedProductId) && <p role="alert" className="mt-1 text-xs text-red-600">{requestError || errors?.selectedProductId}</p>}
        </div>
        <div><p className="text-xs text-[#6B6F78]">Categoría</p><p className="mt-2 border-b pb-2 text-sm">{preview?.inventory.category.name ?? "Sin seleccionar"}</p>{preview && <p className="mt-3 text-sm"><b>Marca:</b> {preview.inventory.brand}</p>}</div>
      </div>
      {preview && <div className="mt-8"><div className="mb-3 flex gap-6 text-sm"><p><b>Producto:</b> {preview.inventory.productName}</p></div><RestockTable rows={value.sizes} errors={errors?.sizes} onChange={updateRow} onRemoveNew={(id) => onChange({ ...value, sizes: value.sizes.filter((row) => row.id !== id) })} /><button type="button" onClick={() => onChange({ ...value, sizes: [...value.sizes, createNewRow()] })} className="mt-3 inline-flex items-center gap-2 font-semibold text-[#1C21D1]"><Plus aria-hidden="true" size={18} className="rounded-full border" />Agregar más talla</button>{errors?.sizesGeneral && <p role="alert" className="mt-2 text-xs text-red-600">{errors.sizesGeneral}</p>}<div className="mt-4 flex justify-end gap-3"><b>Total a reabastecer</b><output className="flex h-8 w-20 items-center justify-center rounded border bg-[#F7F7F8]">{total}</output></div></div>}
    </section>
  );
}
