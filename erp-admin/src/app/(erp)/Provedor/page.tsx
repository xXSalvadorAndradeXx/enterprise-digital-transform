"use client";

import { useState } from "react";

import SearchBar from "@/components/ui/SearchBar";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";

export default function ProveedorPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      header: "Proveedor",
      accessor: "provider",
    },
    {
      header: "Teléfono",
      accessor: "phone",
    },
    {
      header: "Acciones",
      accessor: "actions",
    },
  ];

  const providers = [
    {
      provider: "Nike SV",
      phone: "7777-1111",
      actions: "",
    },
    {
      provider: "Pull&Bear",
      phone: "7777-1221",
      actions: "",
    },
    {
      provider: "Zara",
      phone: "7477-1357",
      actions: "",
    },
  ];

  return (
    <main className="p-8">

      <div className="flex items-start justify-between">

        <div>
          <h1 className="text-5xl font-bold text-black">
            Proveedores
          </h1>

          <p className="mt-3 text-lg text-black">
            Gestiona y visualiza la información de tus proveedores.
          </p>
        </div>

        <select
  className="
    h-[46px]
    w-[210px]
    rounded-[4px]
    border
    border-[#0b07e6]
    bg-white
    px-4
    text-[14px]
    font-normal
    text-[#6B7280]
    outline-none
    transition-all
    focus:border-[#1e14d6]
    focus:ring-1
    focus:ring-[#1f14f0]
  "
>
          <option>Filtrar por empresa</option>
        </select>

      </div>

      <div
        className="
          mt-10
          rounded-lg
          border
          border-gray-400
          bg-white
          p-5
        "
      >

        <div className="mb-5 flex items-center gap-4">

          <button
            className="
              h-[42px]
              rounded-md
              bg-[#2F3CE9]
              px-6
              text-sm
              font-medium
              text-white
            "
          >
            Agregar proveedor
          </button>

          <SearchBar
            value={search}
            onChange={setSearch}
          />

        </div>

        <Table
          columns={columns}
          data={providers}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={24}
          onPageChange={setCurrentPage}
          className="mt-5"
        />

      </div>

    </main>
  );
}