"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import InventoryTable from "./InventoryTable";
import { useInventory } from "../hooks/useInventory";

export default function InventoryCard() {
 const inventory = useInventory();

const {
  query,
  updateQuery,
} = inventory;

  return (
    <section className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-5xl font-bold text-black">
          Inventario
        </h1>

        <p className="mt-2 text-lg text-gray-800">
          Inventario de los productos
        </p>
      </div>

      {/* Tarjeta */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-white shadow-sm">

        {/* Header de la tarjeta */}
        <div className="flex flex-col gap-4 border-b p-6 lg:flex-row lg:items-center lg:justify-between">

          <h2 className="text-2xl font-semibold text-gray-800">
            Inventario
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">

            <Link
              href="/inventario/movimientos"
              className="rounded-md bg-blue-600 px-5 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              Movimiento de inventario
            </Link>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

             <input
  type="text"
  placeholder="Buscar inventario..."
  value={query.search ?? ""}
  onChange={(e) =>
    updateQuery({
      search: e.target.value,
    })
  }
  className="w-full rounded-md border border-blue-500 py-3 pl-10 pr-4 text-black outline-none placeholder:text-gray-500 sm:w-72"
/>
            </div>

          </div>
        </div>

        {/* Tabla */}
        <InventoryTable
  inventory={inventory}
/>

      </div>
    </section>
  );
}