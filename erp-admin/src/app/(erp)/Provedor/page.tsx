"use client";
import { useProveedores } from "@/hooks/proveedor/useProveedores";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import NoSearchResults from "@/components/ui/NoSearchResults";
import LoadingState from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import ModalSuccess from "@/components/ui/ModalSuccess";
import Input from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProveedor } from "./hooks/useCreateProveedor";
import { useUpdateProveedor } from "./hooks/useUpdateProveedor";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteProveedor } from "./hooks/useDeleteProveedor";
import type { Proveedor } from "@/types/proveedor/proveedor.types";

import {
  supplierSchema,
  type SupplierForm,
} from "@/lib/validations/supplierSchema";



import Image from "next/image";

import EmptyIcon from "@/assets/images/bandeja.png";
import ErrorIcon from "@/assets/images/adver.png";
import SearchEmptyIcon from "@/assets/images/lupa.png";

import { useEffect, useState } from "react";


import { SearchBar } from "@/components/ui/SearchBar";
import { Table } from "@/components/ui/Table";
import type {
  TableAction,
  TableColumn,
} from "@/components/ui/Table/Table.types";
import { Pagination } from "@/components/ui/Pagination";

export default function ProveedorPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<Proveedor | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const {
  register: registerEdit,
  handleSubmit: handleSubmitEdit,
  reset,
  setError: setEditError,
  formState: {
    errors: editErrors,
  },
} = useForm<SupplierForm>({
  resolver: zodResolver(supplierSchema),
  mode: "onChange",
});
function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  // Si viene como 50375943334, quitamos el 503
  const local = digits.startsWith("503")
    ? digits.slice(3)
    : digits;

  if (local.length !== 8) {
    return phone;
  }

  return `+503 ${local.slice(0, 4)}-${local.slice(4)}`;
}

function getLocalPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.startsWith("503")
    ? digits.slice(3, 11)
    : digits.slice(0, 8);
}

 const handleEdit = (provider: Proveedor) => {
  setSelectedProvider(provider);

  reset({
    companyName: provider.provider,
    phone: getLocalPhone(provider.phone),
  });

  setOpenEditModal(true);
};

const handleDelete = (provider: Proveedor) => {
  setSelectedProvider(provider);
  setOpenDeleteModal(true);
};

  const {
  register,
  handleSubmit,
  reset: resetCreate,
  setError: setCreateError,
  formState: { errors, isValid },
} = useForm<SupplierForm>({
  resolver: zodResolver(supplierSchema),
  mode: "onChange",
  defaultValues: {
    companyName: "",
    phone: "",
  },
});

const openCreateProviderModal = () => {
  resetCreate({
    companyName: "",
    phone: "",
  });
  setOpenModal(true);
};

const closeCreateProviderModal = () => {
  resetCreate({
    companyName: "",
    phone: "",
  });
  setOpenModal(false);
};

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
  


  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
    setCurrentPage(1);
  }, 500);

  return () => {
    clearTimeout(timer);
  };
}, [search]);

  const isSearching = search !== debouncedSearch;

  const columns: TableColumn<Proveedor>[] = [
    {
      key: "provider",
      header: "Proveedor",
      accessor: (provider) => provider.provider,
    },
    {
      key: "phone",
      header: "Teléfono",
      accessor: (provider) => formatPhone(provider.phone),
    },
  ];

  const actions: TableAction<Proveedor>[] = [
    {
      icon: Pencil,
      label: "Editar proveedor",
      onClick: handleEdit,
      className: "text-black hover:text-[#2F3CE9]",
    },
    {
      icon: Trash2,
      label: "Eliminar proveedor",
      onClick: handleDelete,
      className: "text-[#FF3B30] hover:text-red-700",
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
          <h1 className="text-[32px] font-bold text-black">
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
  onClick={openCreateProviderModal}
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
    onRetry={() => {
      void refresh();
    }}
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
    onButtonClick={openCreateProviderModal}
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
    <Table<Proveedor>
      columns={columns}
      data={providers}
      rowKey={(provider) => provider.id}
      actions={actions}
    />

    <div className="mt-6">
      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  </>
)}
      </div>
<Modal
  isOpen={openModal}
  title="Agregar proveedor"
  onClose={closeCreateProviderModal}
  size="xl"
  headerDivider={false}
>
  

 <form
  onSubmit={handleSubmit(async (data) => {
    try {
      const response = await create(data);

      if (response.status === 201) {
        await refresh();

        setSuccessMessage("¡Proveedor agregado con éxito!");
        resetCreate({
          companyName: "",
          phone: "",
        });
        setOpenModal(false);
        setOpenSuccess(true);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el proveedor.";

      if (message.toLowerCase().includes("phone")) {
        setCreateError("phone", {
          type: "server",
          message: "El número de teléfono no es válido.",
        });
      } else {
        setCreateError("companyName", {
          type: "server",
          message,
        });
      }
    }
  })}
  className="flex flex-col"
>
    <p className="mb-8 text-[18px] text-gray-600">
      Registra un nuevo proveedor para gestionar tus productos.
    </p>

    <div className="flex max-w-[496px] flex-col gap-7">
      <Input
        label="Nombre de empresa"
        required
        error={Boolean(errors.companyName)}
        errorMessage={errors.companyName?.message}
        {...register("companyName")}
      />

      <Input
        label="Teléfono"
        required
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={8}
        placeholder="Ej. 75943334"
        error={Boolean(errors.phone)}
        errorMessage={errors.phone?.message}
        {...register("phone")}
        onInput={(event) => {
          event.currentTarget.value = event.currentTarget.value
            .replace(/\D/g, "")
            .slice(0, 8);
        }}
      />
    </div>

    <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
  <button
    type="button"
    onClick={closeCreateProviderModal}
    className="h-12 w-full rounded-md border border-[#2F3CE9] px-6 text-[#2F3CE9] transition hover:bg-[#2F3CE9] hover:text-white sm:w-[206px]"
  >
    Cancelar
  </button>

 <button
  type="submit"
  disabled={creatingProvider}
  className={`
    h-12
    w-full
    sm:w-[266px]
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

    try {
      const response = await update(selectedProvider.id, data);

      if (response.status === 200) {
        await refresh();

        setSuccessMessage("¡Información actualizada correctamente!");
        setOpenEditModal(false);
        setOpenSuccess(true);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el proveedor.";

      if (message.toLowerCase().includes("phone")) {
        setEditError("phone", {
          type: "server",
          message: "El número de teléfono no es válido.",
        });
      } else {
        setEditError("companyName", {
          type: "server",
          message,
        });
      }
    }
  })}
>

  <Input
  label="Nombre de empresa"
  required
  error={Boolean(editErrors.companyName)}
  errorMessage={editErrors.companyName?.message}
  {...registerEdit("companyName")}
/>

<Input
  label="Teléfono"
  required
  inputMode="numeric"
  autoComplete="tel-national"
  maxLength={8}
  placeholder="Ej. 75943334"
  error={Boolean(editErrors.phone)}
  errorMessage={editErrors.phone?.message}
  {...registerEdit("phone")}
  onInput={(event) => {
    event.currentTarget.value = event.currentTarget.value
      .replace(/\D/g, "")
      .slice(0, 8);
  }}
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
  size="md"
  headerDivider={false}
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

    if (response.status === 204) {
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
