export function ProductsTableSkeleton() {
  const rows = Array.from({ length: 6 });

  return (
    <div
      className="w-full"
      role="status"
      aria-live="polite"
      aria-label="Cargando productos"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500">
              <th className="w-[70px] px-4 py-3 font-medium">
                Foto
              </th>

              <th className="px-4 py-3 font-medium">
                Nombre
              </th>

              <th className="px-4 py-3 font-medium">
                Categoría
              </th>

              <th className="px-4 py-3 font-medium">
                Precio
              </th>

              <th className="px-4 py-3 font-medium">
                Stock
              </th>

              <th className="px-4 py-3 font-medium">
                Estado
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 last:border-0"
                aria-hidden="true"
              >
                <td className="px-4 py-3">
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-center gap-3">
                    <div className="h-7 w-7 animate-pulse rounded bg-gray-200" />
                    <div className="h-7 w-7 animate-pulse rounded bg-gray-200" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="sr-only">
        Cargando productos...
      </span>
    </div>
  );
}