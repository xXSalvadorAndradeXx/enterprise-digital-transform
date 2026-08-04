"use client";

import { useState } from "react";
import { AlertCircle, Eye, KeyRound } from "lucide-react";
import { Pause, Trash2 } from "lucide-react";
import { Table } from "@/components/ui/Table";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { StatusDot } from "@/components/ui/StatusDot";
import { AgregarPersonaModal, type AgregarPersonaResult } from "@/components/equipo/AgregarPersonaModal";
import { EditarUsuarioModal } from "@/components/equipo/EditarUsuarioModal";
import { UsuarioAgregadoModal } from "@/components/equipo/UsuarioAgregadoModal";
import { ContrasenaTemporalModal } from "@/components/equipo/ContrasenaTemporalModal";
import { ESTADO_COLABORADOR_CONFIG, type Colaborador } from "@/types/equipo";
import { useEquipoTable } from "@/hooks/equipo/useEquipoTable";
import { useGenerateTemporaryPassword } from "@/hooks/equipo/useGenerateTemporaryPassword";
import {BulkActionConfirmModal,type BulkActionType,} from "@/components/equipo/BulkActionConfirmModal";

import { Toast } from "@/components/ui/Toast";

import {
  UnlockUserModal,
  type UnlockOption,
} from "@/components/equipo/UnlockUserModal";

import { useUnlockUser } from "@/hooks/equipo/useUnlockUser";

import { useUnlockAndResetPassword } from "@/hooks/equipo/useUnlockAndResetPassword";

import { useBulkUserActions } from "@/hooks/equipo/useBulkUserActions";

// Arma el título y la descripción del Toast con la concordancia correcta en
// singular ("El usuario fue desactivado...") vs plural ("Los 3 usuarios
// fueron desactivados...").
function buildBulkActionToastText(action: BulkActionType, count: number) {
  const isSingular = count === 1;
  const isDeactivate = action === "deactivate";

  const title = isDeactivate
    ? isSingular
      ? "Usuario desactivado"
      : "Usuarios desactivados"
    : isSingular
      ? "Usuario eliminado"
      : "Usuarios eliminados";

  const participio = isDeactivate
    ? isSingular
      ? "desactivado"
      : "desactivados"
    : isSingular
      ? "eliminado"
      : "eliminados";

  const sujeto = isSingular ? "El usuario" : `Los ${count} usuarios`;
  const verbo = isSingular ? "fue" : "fueron";

  return { title, description: `${sujeto} ${verbo} ${participio} correctamente.` };
}

export default function EquipoPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
    searchInput,
    setSearchInput,
    page,
    setPage,
    totalPages,
    selected,
    setSelected,
    selectedColaborador,
    openDetalle,
    closeDetalle,
  } = useEquipoTable();

    const tableData = data;
    const tableError = error;
    const tableLoading = isLoading;

    const selectedUsers = tableData.filter((colaborador) =>
      selected.has(colaborador.id)
    );

      const {
        generatePassword,
        isLoading: isGeneratingPassword,
        error: generatePasswordError,
        clearError: clearGeneratePasswordError,
      } = useGenerateTemporaryPassword();

      const {
      unlockUser,
      isLoading: isUnlocking,
      error: unlockError,
      clearError: clearUnlockError,
    } = useUnlockUser();

    const {
      unlockAndResetPassword,
      isLoading: isUnlockingAndResetting,
      error: unlockAndResetError,
      clearError: clearUnlockAndResetError,
    } = useUnlockAndResetPassword();

    const {
  deactivateSelectedUsers,
  deleteSelectedUsers,
  isLoading: isBulkActionLoading,
  error: bulkActionError,
  clearError: clearBulkActionError,
} = useBulkUserActions();


  // Puntos de entrada / modales de T-06
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [editarColaborador, setEditarColaborador] = useState<Colaborador | null>(null);
  const [usuarioAgregado, setUsuarioAgregado] = useState<AgregarPersonaResult | null>(null);
  const [contrasenaTemporal, setContrasenaTemporal] = useState<{ usuario: string; contrasenaTemporal: string } | null>(
    null
  );
  const [cambiosGuardadosNombre, setCambiosGuardadosNombre] = useState<string | null>(null);


const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);



  const handleAgregarPersonaSuccess = (result: AgregarPersonaResult) => {
    setUsuarioAgregado(result);
    refetch();
  };

  const handleEditarSuccess = (nombre: string) => {
    setCambiosGuardadosNombre(nombre);
    refetch();
  };

  const handleEditarDesdeDetalle = () => {
    if (!selectedColaborador) return;
    setEditarColaborador(selectedColaborador);
    closeDetalle();
  };

  const handleGenerarContrasena =
    async (): Promise<void> => {
      if (!selectedColaborador) {
        return;
      }

      clearGeneratePasswordError();

      const generatedPassword =
        await generatePassword(selectedColaborador.id);

      if (!generatedPassword) {
        return;
      }

      setContrasenaTemporal({
        usuario: selectedColaborador.nombre,
        contrasenaTemporal: generatedPassword,
      });

      closeDetalle();
    };

      const handleUnlockUser = async (
    option: UnlockOption,
  ): Promise<void> => {
    if (!usuarioBloqueado) {
      return;
    }

    try {
      clearUnlockError();
      clearUnlockAndResetError();

      if (option === "desbloquear") {
        await unlockUser(usuarioBloqueado.id);

        setToast({
          title: "Usuario desbloqueado",
          description: `${usuarioBloqueado.nombre} fue desbloqueado correctamente.`,
        });

        setUsuarioBloqueado(null);
        refetch();
        return;
      }

      const response =
        await unlockAndResetPassword(
          usuarioBloqueado.id,
        );

      setContrasenaTemporal({
        usuario: usuarioBloqueado.nombre,
        contrasenaTemporal:
          response.temporaryPassword,
      });

      setUsuarioBloqueado(null);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };


const handleConfirmBulkAction =
  async (): Promise<void> => {
    if (!bulkAction || selectedUsers.length === 0) {
      return;
    }

    const userIds = selectedUsers.map(
      (user) => String(user.id),
    );

    try {
      clearBulkActionError();

      const result =
        bulkAction === "deactivate"
          ? await deactivateSelectedUsers(userIds)
          : await deleteSelectedUsers(userIds);

      const affectedCount =
        result.successfulIds.length;

      setSelected(new Set());
      setBulkAction(null);

      setToast(
        buildBulkActionToastText(
          bulkAction,
          affectedCount,
        ),
      );

      refetch();
    } catch (error) {
      console.error(
        "Error al ejecutar la acción masiva:",
        error,
      );
    }
  };

const [usuarioBloqueado, setUsuarioBloqueado] =
  useState<Colaborador | null>(null);

const [toast, setToast] = useState<{
  title: string;
  description: string;
} | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Equipo</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAgregarOpen(true)}
            className="whitespace-nowrap rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            Agregar persona
          </button>
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </div>
      </div>

      {tableError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <AlertCircle className="text-red-500" size={32} />
          <p className="text-sm text-gray-600">{tableError}</p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <Table<Colaborador>
          columns={[
            { key: "nombre", header: "Nombre", accessor: (c) => c.nombre, sortable: false },
            { key: "correo", header: "Correo", accessor: (c) => c.correo },
            { key: "rol", header: "Rol", accessor: (c) => c.rol },
            {
              key: "estado",
              header: "Estado",
              accessor: (c) => {
                const config = ESTADO_COLABORADOR_CONFIG[c.estado];
                return <StatusDot label={config.label} tone={config.tone} icon={config.icon} />;
              },
            },
            { key: "fecha", header: "Fecha", accessor: (c) => c.fecha, sortable: false },
          ]}
          data={tableData}
          rowKey={(c) => c.id}
          isLoading={tableLoading}
          selectable
          selectedRows={selected}
          onSelectionChange={setSelected}
          actions={[
            {
              icon: Eye,
              label: "Ver detalle",
              onClick: openDetalle,
              show: (colaborador) =>
                colaborador.estado !== "bloqueado_intento",
            },
            {
              icon: KeyRound,
              label: "Desbloquear usuario",
              onClick: (colaborador) => {
                setUsuarioBloqueado(colaborador);
              },
              show: (colaborador) =>
                colaborador.estado === "bloqueado_intento",
              className: "text-[#F59E0B] hover:bg-amber-50",
            },
          ]}            

          bulkActions={(selectedCount) => (
            <>
              <button
                type="button"
                onClick={() =>
                  setBulkAction("deactivate")
                }
                disabled={
                  selectedCount === 0 ||
                  isBulkActionLoading
                }
                className="flex h-9 w-[118px] items-center justify-center gap-1.5 rounded-lg border border-[#1C21D1] bg-white px-2.5 text-[14px] font-normal text-black transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:opacity-50 disabled:hover:bg-white"
              >
                <Pause
                  size={15}
                  strokeWidth={1.5}
                  className="shrink-0"
                />
                <span>Desactivar</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setBulkAction("delete")
                }
                disabled={
                  selectedCount === 0 ||
                  isBulkActionLoading
                }
                className="flex h-9 w-[108px] items-center justify-center gap-1.5 rounded-lg border border-[#1C21D1] bg-white px-2.5 text-[14px] font-normal text-black transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:opacity-50 disabled:hover:bg-white"
              >
                <Trash2
                  size={15}
                  strokeWidth={1.5}
                  className="shrink-0"
                />
                <span>Eliminar</span>
              </button>
            </>
          )}

          emptyMessage={
            searchInput.trim()
              ? `No se encontraron colaboradores para "${searchInput.trim()}".`
              : "Todavía no hay colaboradores registrados."
          }
        />
      )}

      {!tableError && (
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    )}

      {/* Detalle (solo lectura) */}
<Modal
  isOpen={selectedColaborador !== null}
  onClose={closeDetalle}
  title="Detalles del Colaborador"
  fields={
    selectedColaborador
      ? [
          { label: "Nombre Completo", value: selectedColaborador.nombre },
          { label: "Correo Electrónico", value: selectedColaborador.correo },
          { label: "Rol", value: selectedColaborador.rol },
          { label: "Estado", value: ESTADO_COLABORADOR_CONFIG[selectedColaborador.estado].label },
          { label: "Fecha de Registro", value: selectedColaborador.fecha },
        ]
      : []
  }
      footer={
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => {
                clearGeneratePasswordError();
                closeDetalle();
              }}
              disabled={isGeneratingPassword}
              className="w-36 rounded-md border border-[#1C21D1] py-2 text-sm font-medium text-[#030303] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGenerarContrasena}
              disabled={isGeneratingPassword}
              className="w-72 whitespace-nowrap rounded-md bg-[#1C21D1] py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingPassword
                ? "Generando..."
                : "Generar contraseña temporal"}
            </button>

            <button
              type="button"
              onClick={handleEditarDesdeDetalle}
              disabled={isGeneratingPassword}
              className="w-36 rounded-md bg-[#1C21D1] py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Editar
            </button>
          </div>

          {generatePasswordError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {generatePasswordError}
            </div>
          )}
        </div>
      }
/>

{generatePasswordError && (
  <div
    role="alert"
    className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    {generatePasswordError}
  </div>
)}

      {/* Agregar persona */}
      <AgregarPersonaModal isOpen={agregarOpen} onClose={() => setAgregarOpen(false)} onSuccess={handleAgregarPersonaSuccess} />

      {/* Editar (desde el ícono de la tabla o desde el botón "Editar" del detalle) */}
      <EditarUsuarioModal
        isOpen={editarColaborador !== null}
        onClose={() => setEditarColaborador(null)}
        colaborador={editarColaborador}
        onSuccess={handleEditarSuccess}
      />

          <UnlockUserModal
      isOpen={usuarioBloqueado !== null}
      onClose={() => {
        clearUnlockError();
        clearUnlockAndResetError();
        setUsuarioBloqueado(null);
      }}
      nombreUsuario={
        usuarioBloqueado?.nombre ?? ""
      }
      onConfirm={handleUnlockUser}
      isLoading={
        isUnlocking ||
        isUnlockingAndResetting
      }
      error={
        unlockError ??
        unlockAndResetError
      }
    />

      {/* Éxito: usuario agregado (con credenciales) */}
      <UsuarioAgregadoModal
        isOpen={usuarioAgregado !== null}
        onClose={() => setUsuarioAgregado(null)}
        usuario={usuarioAgregado?.usuario ?? ""}
        contrasenaTemporal={usuarioAgregado?.contrasenaTemporal ?? ""}
      />

      {/* Éxito: contraseña temporal generada */}
      <ContrasenaTemporalModal
        isOpen={contrasenaTemporal !== null}
        onClose={() => setContrasenaTemporal(null)}
        usuario={contrasenaTemporal?.usuario ?? ""}
        contrasenaTemporal={contrasenaTemporal?.contrasenaTemporal ?? ""}
      />

      {/* Éxito: cambios guardados (edición) — no tenía componente propio en T-05, es el SuccessModal genérico */}
      <SuccessModal
        isOpen={cambiosGuardadosNombre !== null}
        onClose={() => setCambiosGuardadosNombre(null)}
        title="¡Cambios guardados con éxito!"
        description={
          cambiosGuardadosNombre
            ? `La información de ${cambiosGuardadosNombre} se ha actualizado correctamente.`
            : ""
        }
      />

        {/* Confirmación de acciones masivas */}
        <BulkActionConfirmModal
          isOpen={bulkAction !== null}
          action={bulkAction ?? "deactivate"}
          users={selectedUsers}
          isLoading={isBulkActionLoading}
          onClose={() => {
            setBulkAction(null);
            setSelected(new Set());

            {bulkActionError && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {bulkActionError}
              </div>
            )}
          }}
          onConfirm={handleConfirmBulkAction}
          
        />
        
        <Toast
          isOpen={toast !== null}
          title={toast?.title ?? ""}
          description={toast?.description ?? ""}
          onClose={() => setToast(null)}
        />

    </div>
  );
}