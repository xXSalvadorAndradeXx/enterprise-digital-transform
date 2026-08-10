"use client";

import React, { useState } from "react";
import type {
  InventoryDetailDto,
} from "../types";


import type { UseInventoryReturn } from "../hooks/useInventory";

interface Props {
  inventory: UseInventoryReturn;
}

export default function InventoryTable({
  inventory,
}: Props) {

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


  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [variants, setVariants] = useState<
  Record<string, readonly InventoryDetailDto[]>
  >({});

 const toggleRow = async (id: string) => {
  if (expandedRows.includes(Number(id))) {
    setExpandedRows((prev) =>
      prev.filter((item) => item !== Number(id))
    );
    return;
  }

  if (!variants[id]) {
    try {

      const data = await loadVariants(id);

      setVariants((prev) => ({
        ...prev,
        [id]: data,
      }));
    } catch {
      return;
    }
  }

  setExpandedRows((prev) => [...prev, Number(id)]);
};
  if (loading) {
  return (
    <div className="p-8 text-center text-gray-500">
      Cargando inventario...
    </div>
  );
}

if (error) {
  return (
    <div className="p-8 text-center">
      <p className="mb-4 text-red-500">{error}</p>

      <button
        onClick={retry}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Reintentar
      </button>
    </div>
  );
}

if (items.length === 0) {
  return (
    <div className="py-8 text-center text-gray-500">
      {query.search
        ? "No se encontraron resultados."
        : "No hay registros."}
    </div>
  );
}

  return (
    <>
      <div className="overflow-hidden rounded-b-xl border-t border-gray-200">
        <table className="w-full border-collapse">
          <thead className="bg-[#F2F1FF]">
            <tr className="h-12 text-sm font-medium text-gray-600">
              <th className="w-14 text-center">↑↓</th>
              <th className="text-left">ID</th>
              <th className="text-left">Producto</th>
              <th className="text-left">Proveedor</th>
              <th className="text-left">Fecha</th>
              <th className="text-left">Precio</th>
              <th className="text-center">Status</th>
              <th className="text-center">Stock</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
           {items.map((item) => (
            <React.Fragment key={item.id}>
  <tr key={item.id} className="h-16 text-sm text-gray-700">
    <td className="text-center">
      <button
         onClick={async () => {
         await toggleRow(item.id);
         }}
        className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-[#D9E7FF] text-[#5D8BFF]"
      >
        {expandedRows.includes(Number(item.id)) ? "⌃" : "⌄"}
      </button>
    </td>

    <td>{item.id}</td>

    <td className="max-w-[140px] truncate">
      {item.productName}
    </td>

    <td>{item.supplier.name}</td>

    <td>
      {new Date(item.createdAt).toLocaleDateString()}
    </td>

    <td>${item.totalInventoryCost}</td>

    <td className="text-center">
      <span className="rounded-md bg-[#DDF6DA] px-4 py-1 text-[#4CAF50]">
        {item.status}
      </span>
    </td>

    <td className="text-center">
      {item.totalStock}
    </td>
  </tr>
  {expandedRows.includes(Number(item.id)) &&
  variants[item.id] && (
    <tr>
      <td colSpan={8} className="bg-white px-5 pb-5">
        <div className="overflow-hidden rounded-md border border-[#E8E7FA] bg-[#F5F4FF]">
          <table className="w-full">
            <thead className="bg-[#ECEBFF]">
              <tr className="text-sm font-semibold text-[#374151]">
                <th className="px-8 py-4 text-left">Talla</th>
                <th className="px-8 py-4 text-left">SKU</th>
                <th className="px-8 py-4 text-left">STOCK</th>
                <th className="px-8 py-4 text-left">Costo uni.</th>
                <th className="px-8 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {variants[item.id].map((variant) => (
                <tr
                  key={variant.id}
                  className="border-t border-[#E8E7FA]"
                >
                  <td className="px-8 py-4">{variant.size}</td>
                  <td className="px-8 py-4">{variant.sku}</td>
                  <td className="px-8 py-4">{variant.stock}</td>
                  <td className="px-8 py-4">${variant.unitCost}</td>
                  <td className="px-8 py-4 text-center">
                    {variant.stockStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
)}
   </React.Fragment>
  
))}
          </tbody>
        </table>

        <div className="flex items-center justify-end gap-6 border-t border-gray-100 px-8 py-5 text-sm text-gray-500">
          <button>{"<"}</button>

          {Array.from(
  { length: meta.totalPages },
  (_, index) => index + 1
).map((page) => (
  <button
    key={page}
    onClick={() =>
      updateQuery({
        page,
      })
    }
    className={`h-8 w-8 rounded ${
      meta.page === page
        ? "bg-gray-100 text-black"
        : ""
    }`}
  >
    {page}
  </button>
))}

          <button>{">"}</button>
        </div>
      </div>
    </>
  );
}