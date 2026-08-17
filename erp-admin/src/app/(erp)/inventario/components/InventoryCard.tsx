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
    <section className="min-w-0 space-y-4 sm:space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-[32px] font-bold text-black ">
          Inventario
        </h1>

        <p className="text-[18px] mt-2 text-base text-gray-800 ">
          Inventario de los productos
        </p>
      </div>

      {/* Tarjeta */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-white shadow-sm">

        {/* Header de la tarjeta */}
        <div className="flex flex-col gap-4 border-b p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Inventario
          </h2>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

            <Link
              href="/inventario/movimientos"
              className="w-53.75  rounded-md bg-[#1C21D1] px-5 py-3 text-center font-medium text-white hover:bg-blue-700 sm:w-auto"
            >
              Movimiento de inventario
            </Link>

            <div className="relative w-full sm:flex-1 lg:w-auto">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={24}
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
  className="w-full rounded-md border border-blue-500 py-3 pl-10 pr-4 text-black outline-none placeholder:text-gray-500 lg:w-72"
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
