import Link from "next/link";

import MovementTable from "../components/MovementTable";

export default function MovimientosPage() {
  return (
    <div className="min-w-0 space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[32px] font-bold leading-tight text-black ">
          Movimiento de inventario
        </h1>

        <Link
          href="/inventario"
          className="inline-flex h-11 w-full items-center justify-center rounded border-2 border-blue-600 px-8 text-base font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-36"
        >
          Volver
        </Link>
      </div>

      <MovementTable />
    </div>
  );
}
