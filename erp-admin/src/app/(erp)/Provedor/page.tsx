"use client";
import { useProveedores } from "@/hooks/proveedor/useProveedores";
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

  const view = "table"; // Cambia esto según la vista que quieras mostrar

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

  

  const {
  providers,
  pagination,
  loading,
  error,
  isEmpty,
  isNoResults,
} = useProveedores(debouncedSearch, currentPage, 10);

  return (
    <main className="p-8">
      <div>
        <div>
          <h1 className="text-5xl font-bold text-black">
            Proveedores
          </h1>

          <p className="mt-3 text-lg text-black">
            Gestiona y visualiza la información de tus proveedores.
          </p>
        </div>

      
      </div>

      <div
  className={`
    mt-10
    bg-white
    p-5
    rounded-lg
    border
    border-gray-400
  `}
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
{isSearching || loading ? (
  <LoadingState />
) : error ? (
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
) : isEmpty ? (
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
) : isNoResults ? (
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
) : (
  <>
    <Table
      columns={columns}
      data={providers}
      showBorder={false}
    />

    <Pagination
      currentPage={currentPage}
      totalPages={pagination.totalPages}
      onPageChange={setCurrentPage}
      className="mt-6"
    />
  </>
)}
      </div>
    </main>
  );
}