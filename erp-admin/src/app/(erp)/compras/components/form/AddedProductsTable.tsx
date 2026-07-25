"use client";

import { Trash2 } from "lucide-react";

import type { PurchaseVariantValue } from "./VariantRow";

export type AddedProduct = {
  id: string;
  name: string;
  sku: string;
  invoiceFile: File | null;
  variants: PurchaseVariantValue[];
  quantity: number;
  unitCost: number;
  total: number;
};

type AddedProductsTableProps = {
  products: AddedProduct[];
  onOpen: (productId: string, trigger: HTMLButtonElement) => void;
  onRemove: (productId: string) => void;
};

function formatMoney(value: number) {
  return value.toLocaleString("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function AddedProductsTable({
  products,
  onOpen,
  onRemove,
}: AddedProductsTableProps) {
  return (
    <section aria-labelledby="added-products-title" className="mt-6">
      <h2 id="added-products-title" className="mb-3 text-base font-semibold">
        Detalle del ingreso (Productos añadidos)
      </h2>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[#EEEAFE]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
              <th scope="col" className="px-4 py-3 font-semibold">SKU</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Cantidad</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Costo Unit.</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">
                <span className="sr-only">Acción de eliminar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="border-b border-[#E1E4E9] px-4 py-5 text-center text-[#4A4A4A]">
                  No hay productos añadidos.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  onClick={(event) => {
                    const trigger =
                      event.currentTarget.querySelector<HTMLButtonElement>(
                        "[data-detail-trigger]",
                      );
                    if (trigger) onOpen(product.id, trigger);
                  }}
                  className="cursor-pointer border-b border-[#E1E4E9]"
                >
                  <td className="p-0">
                    <button
                      data-detail-trigger
                      type="button"
                      className="w-full cursor-pointer px-4 py-3 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1C21D1]"
                    >
                      {product.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{product.sku}</td>
                  <td className="px-4 py-3 text-center">{product.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(product.unitCost)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(product.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      aria-label={`Eliminar ${product.name} de los productos añadidos`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(product.id);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
