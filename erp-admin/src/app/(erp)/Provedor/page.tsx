"use client";
import { useProveedores } from "@/hooks/proveedor/useProveedores";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import NoSearchResults from "@/components/ui/NoSearchResults";
import LoadingState from "@/components/ui/LoadingState";
import Modal from "@/components/ui/Modal";
import ModalSuccess from "@/components/ui/ModalSuccess";
import Input from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProveedor } from "./hooks/useCreateProveedor";
import { useUpdateProveedor } from "./hooks/useUpdateProveedor";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteProveedor } from "./hooks/useDeleteProveedor";

import {
  supplierSchema,
  type SupplierForm,
} from "@/lib/validations/supplierSchema";



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
  const [openModal, setOpenModal] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const {
  register: registerEdit,
  handleSubmit: handleSubmitEdit,
  reset,
  trigger: triggerEdit,
  formState: {
    errors: editErrors,
    isValid: isEditValid,
  },
} = useForm<SupplierForm>({
  resolver: zodResolver(supplierSchema),
  mode: "onChange",
});
console.log("EDIT FORM", {
  isEditValid,
  editErrors,
});
 const handleEdit = (provider: any) => {
  console.log(provider);

  setSelectedProvider(provider);

  reset({
    companyName: provider.provider,
    phone: provider.phone,
  });

  setOpenEditModal(true);
};

const handleDelete = (provider: any) => {
  setSelectedProvider(provider);
  setOpenDeleteModal(true);
};

  const {
  register,
  handleSubmit,
  trigger,
  setError,
  formState: { errors, isValid },
} = useForm<SupplierForm>({
  resolver: zodResolver(supplierSchema),
  mode: "onChange",
});

const {
  create,
  loading: creatingProvider,
} = useCreateProveedor();

const {
  update,
  loading: updatingProvider,
} = useUpdateProveedor();
const {
  remove,
  loading: deletingProvider,
} = useDeleteProveedor();
  


  const view = "table"; // Cambia esto según la vista que quieras mostrar
  
useEffect(() => {
  if (openModal) {
    trigger();
  }
}, [openModal, trigger]);

useEffect(() => {
  if (openEditModal) {
    triggerEdit();
  }
}, [openEditModal, triggerEdit]);


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
  render: (_, row) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleEdit(row)}
        className="
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded
          border
          border-[#D1D5DB]
          bg-white
          hover:bg-gray-100
        "
      >
        <Pencil
          size={13}
          strokeWidth={2}
          className="text-black"
        />
      </button>

      <button
        type="button"
        onClick={() => handleDelete(row)}
        className="
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded
          border
          border-[#D1D5DB]
          bg-white
          hover:bg-red-50
        "
      >
        <Trash2
          size={13}
          className="text-[#FF3B30]"
        />
      </button>
    </div>
  ),
},
  ];

  

  const {
  providers,
  pagination,
  loading,
  error,
  isEmpty,
  isNoResults,
  refresh,
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
  onClick={() => setOpenModal(true)}
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
      <Modal
  isOpen={openModal}
  title="Agregar proveedor"
  onClose={() => setOpenModal(false)}
>
  

  <form
  onSubmit={handleSubmit(async (data) => {
    const response = await create(data);

    if (response.status === 409) {
  setError("companyName", {
    type: "server",
    message: response.errors.companyName,
  });

  return;
}

   if (response.status === 201) {
  await refresh();
  setSuccessMessage("¡Proveedor agregado con éxito!");
  setOpenModal(false);
  setOpenSuccess(true);
  }
  
  })}
>
    <p className="text-gray-600">
      Registra un nuevo proveedor para gestionar tus productos.
    </p>

   <Input
  label="Nombre de empresa"
  required
  error={errors.companyName?.message}
{...register("companyName")}
/>

<Input
  label="Teléfono"
  required
  error={errors.phone?.message}
  {...register("phone")}
/>

    <div className="mt-8 flex items-center gap-4">
  <button
    type="button"
    onClick={() => setOpenModal(false)}
    className="min-w-[120px] rounded-md border border-[#2F3CE9] px-6 py-2 text-[#2F3CE9] transition hover:bg-[#2F3CE9] hover:text-white"
  >
    Cancelar
  </button>

 <button
  type="submit"
  disabled={creatingProvider}
  className={`
    min-w-[180px]
    rounded-md
    px-6
    py-2
    text-white
    transition
    ${
      isValid
        ? "bg-[#2F3CE9] hover:bg-[#2432d4]"
        : "cursor-not-allowed bg-gray-400"
    }
  `}
>
  {creatingProvider ? "Guardando..." : "Guardar proveedor"}
</button>
</div>
  </form>
</Modal>

<ModalSuccess
  isOpen={openSuccess}
  message={successMessage}
  onAccept={() => setOpenSuccess(false)}
/>

<Modal
  isOpen={openEditModal}
  title="Editar proveedor"
  onClose={() => setOpenEditModal(false)}
>
  <form
  onSubmit={handleSubmitEdit(async (data) => {
    if (!selectedProvider) return;

    const response = await update(selectedProvider.id, data);

    if (response.status === 200) {
      await refresh();

      setSuccessMessage("¡Información actualizada correctamente!");
      setOpenEditModal(false);
      setOpenSuccess(true);
    }
  })}
>

  <Input
  label="Nombre de empresa"
  required
  error={editErrors.companyName?.message}
  {...registerEdit("companyName")}
/>

<Input
  label="Teléfono"
  required
  error={editErrors.phone?.message}
  {...registerEdit("phone")}
/>

  <div className="mt-8 flex items-center gap-4">
    <button
      type="button"
      onClick={() => setOpenEditModal(false)}
      className="min-w-[120px] rounded-md border border-[#2F3CE9] px-6 py-2 text-[#2F3CE9] transition hover:bg-[#2F3CE9] hover:text-white"
    >
      Cancelar
    </button>

    <button
  type="submit"
  disabled={updatingProvider}
  className={`
    min-w-[180px]
    rounded-md
    px-6
    py-2
    text-white
    transition
    ${
  updatingProvider
    ? "cursor-not-allowed bg-gray-400"
    : "bg-[#2F3CE9] hover:bg-[#2432d4]"
    }
  `}
>
 {updatingProvider ? "Guardando..." : "Guardar proveedor"}
</button>
  </div>
</form>
</Modal>
<Modal
  isOpen={openDeleteModal}
  title=""
  onClose={() => setOpenDeleteModal(false)}
  showCloseButton={false}
>
  <div className="flex flex-col items-center text-center">

  <Image
    src={ErrorIcon}
    alt="Advertencia"
    width={78}
    height={78}
    className="mb-5"
  />

  <h2 className="mb-3 text-[20px] font-bold text-[#1E1E1E]">
    Eliminar proveedor
  </h2>

  <p className="mb-8 max-w-[320px] text-[16px] leading-7 text-[#1a1919]">
    ¿Estás seguro de que deseas eliminar este proveedor?
  </p>

  <div className="flex gap-3">

    <button
      type="button"
      onClick={() => setOpenDeleteModal(false)}
      className="
        h-10
        w-[95px]
        rounded-md
        border
        border-[#FF3B30]
        bg-white
        text-sm
        font-medium
        text-black
        transition
        hover:bg-red-50
      "
    >
      Cancelar
    </button>

    <button
  type="button"
  disabled={deletingProvider}
  onClick={async () => {
    if (!selectedProvider) return;

    const response = await remove(selectedProvider.id);

    if (response.status === 200) {
      await refresh();

      setOpenDeleteModal(false);

      setSuccessMessage("¡Proveedor eliminado correctamente!");

      setOpenSuccess(true);
    }
  }}
  className="
    h-10
    w-[95px]
    rounded-md
    bg-[#FF4D4F]
    text-sm
    font-medium
    text-white
    transition
    hover:bg-[#e53935]
    disabled:cursor-not-allowed
    disabled:bg-gray-400
  "
>
  {deletingProvider ? "Eliminando..." : "Eliminar"}
</button>

  </div>

</div>
</Modal>
    </main>
  );
}