"use client";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import NoSearchResults from "@/components/ui/NoSearchResults";
import LoadingState from "@/components/ui/LoadingState";


import Image from "next/image";

import EmptyIcon from "@/assets/images/bandeja.png";
import ErrorIcon from "@/assets/images/adver.png";
import SearchEmptyIcon from "@/assets/images/lupa.png";

import { useEffect, useState } from "react";

const loadProviders = () => {
  // Aquí irá la petición a la API cuando exista.
  console.log("Reintentando cargar proveedores...");
};

import SearchBar from "@/components/ui/SearchBar";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";

export default function ProveedorPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const view:
  | "loading"
  | "table"
  | "empty"
  | "no-results"
  | "error" = "loading"; // Cambia esto según la vista que quieras mostrar

  useEffect(() => {
  setIsSearching(true);

  const timer = setTimeout(() => {
    setDebouncedSearch(search);
    setCurrentPage(1);
    setIsSearching(false);
  }, 500);

  return () => {
    clearTimeout(timer);
  };
}, [search]);

  useEffect(() => {
    console.log("Buscando:", debouncedSearch);
  }, [debouncedSearch]);

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

  const filteredProviders = providers.filter((provider) =>
  provider.provider
    .toLowerCase()
    .includes(debouncedSearch.toLowerCase())
);

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
            border-[#d3d3ed]
            bg-white
            px-4
            text-[14px]
            font-normal
            text-[#6B7280]
            outline-none
            transition-all
            focus:border-[#a9a6e4]
            focus:ring-1
            focus:ring-[#b8b7d4]
          "
        >
          <option>Filtrar por empresa</option>
        </select>
      </div>

      <div
        className={`
          mt-10
          bg-white
          p-5
          ${
            view === "table"
              ? "rounded-lg border border-gray-400"
              : ""
          }
        `}
      >
        {view === "table" ? (
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
        ) : (
          <div className="mb-5 flex items-center gap-3">
  <SearchBar
    value={search}
    onChange={setSearch}
  />

  {search.trim() !== "" && (
    <button
      onClick={() => setSearch("")}
      className="
        rounded-md
        border
        border-gray-300
        px-4
        py-2
        text-sm
        text-gray-600
        transition
        hover:bg-gray-100
      "
    >
      Limpiar
    </button>
  )}
</div>
        )}

        {view === "loading" && (
  <div className="mt-20">
    <LoadingState />
  </div>
)}

        {view === "table" && (
  <>
    {isSearching ? (
      <LoadingState />
    ) : filteredProviders.length > 0 ? (
      <>
        <Table
          columns={columns}
          data={filteredProviders}
          showBorder={false}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={24}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </>
    ) : (
      <NoSearchResults
        image={
          <Image
            src={SearchEmptyIcon}
            alt="Sin resultados"
            width={320}
            height={320}
          />
        }
        title="No encontramos resultados"
        description="No encontramos resultados para la búsqueda realizada."
        buttonText="Limpiar búsqueda"
        onButtonClick={() => {
          setSearch("");
          setCurrentPage(1);
        }}
      />
    )}
  </>
)}
                {view === "empty" && (
          <EmptyState
            image={
              <Image
                src={EmptyIcon}
                alt="Sin proveedores"
                width={120}
                height={120}
              />
            }
            title="No hay proveedores aún"
            description="Cuando agregues algún proveedor, aparecerá aquí."
            helperText="Puedes agregar tu primer proveedor para comenzar."
            buttonText="Agregar proveedor"
            onButtonClick={() => {}}
          />
        )}

{view === "no-results" && (
          <NoSearchResults
  image={
    <Image
      src={SearchEmptyIcon}
      alt="Sin resultados"
      width={320}
      height={320}
    />
  }
  title="No encontramos resultados"
  description="No encontramos resultados para la búsqueda realizada."
  buttonText="Limpiar búsqueda"
  onButtonClick={() => {
  setSearch("");
  setCurrentPage(1);
}}
/>
        )}

        {view === "error" && (
         <ErrorState
  image={
    <Image
      src={ErrorIcon}
      alt="Error"
      width={120}
      height={120}
    />
  }
  title="No se pudieron cargar los proveedores"
  description="Ocurrió un error al intentar cargar la información. Por favor, intenta nuevamente."
  buttonText="Reintentar"
  onRetry={loadProviders}
/>
        )}
      </div>
    </main>
  );
}