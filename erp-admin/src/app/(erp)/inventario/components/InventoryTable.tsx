"use client";

export default function InventoryTable() {
  return (
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
  <tr className="h-16 text-sm text-gray-700">
    <td className="text-center">
      <button className="flex h-6 w-6 items-center justify-center rounded bg-[#D9E7FF] text-[#5D8BFF] mx-auto">
        ^
      </button>
    </td>

    <td>#10001</td>

    <td className="max-w-[140px] truncate">
      Raw Black ....
    </td>

    <td>Empresa Beta</td>

    <td>18/10/2026</td>

    <td>$10</td>

    <td className="text-center">
      <span className="rounded-md bg-[#DDF6DA] px-4 py-1 text-[#4CAF50]">
        ALTO
      </span>
    </td>

    <td className="text-center">50</td>
  </tr>

  <tr className="h-16 text-sm text-gray-700">
    <td className="text-center">
      <button className="flex h-6 w-6 items-center justify-center rounded bg-[#D9E7FF] text-[#5D8BFF] mx-auto">
        ^
      </button>
    </td>

    <td>#10002</td>

    <td className="max-w-[140px] truncate">
      Raw Black ....
    </td>

    <td>Empresa Beta</td>

    <td>18/10/2026</td>

    <td>$10</td>

    <td className="text-center">
      <span className="rounded-md bg-[#FFE0E0] px-4 py-1 text-[#FF4D4F]">
        BAJO
      </span>
    </td>

    <td className="text-center">10</td>
  </tr>

  <tr className="h-16 text-sm text-gray-700">
    <td className="text-center">
      <button className="flex h-6 w-6 items-center justify-center rounded bg-[#D9E7FF] text-[#5D8BFF] mx-auto">
        ^
      </button>
    </td>

    <td>#10003</td>

    <td className="max-w-[140px] truncate">
      Raw Black ....
    </td>

    <td>Empresa Beta</td>

    <td>18/10/2026</td>

    <td>$10</td>

    <td className="text-center">
      <span className="rounded-md bg-[#FFF4D6] px-4 py-1 text-[#E6A700]">
        Medio
      </span>
    </td>

    <td className="text-center">27</td>
  </tr>
</tbody>
      </table>
      <div className="flex items-center justify-end gap-6 border-t border-gray-100 px-8 py-5 text-sm text-gray-500">
  <button>{"<"}</button>

  <button className="h-8 w-8 rounded bg-gray-100 text-black">
    1
  </button>

  <button>2</button>

  <span>...</span>

  <button>23</button>

  <button>24</button>

  <button>{">"}</button>
</div>
    </div>
  );
}