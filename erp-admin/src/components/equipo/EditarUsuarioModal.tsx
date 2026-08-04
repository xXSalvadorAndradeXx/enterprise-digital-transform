"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useRoles } from "@/hooks/equipo/useRoles";
import { useUpdateUser } from "@/hooks/equipo/useUpdateUser";

import {
  ESTADO_EDITABLE_OPTIONS,
  type Colaborador,
} from "@/types/equipo";

import {
  editarUsuarioSchema,
  type EditarUsuarioForm,
} from "@/types/equipo/schemas";

import {
  FormField,
  formInputClass,
} from "./formPrimitives";

export interface EditarUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: Colaborador | null;
  onSuccess: (nombre: string) => void;
}

function separarNombreCompleto(nombreCompleto: string): {
  firstName: string;
  lastName: string;
} {
  const partes = nombreCompleto
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const [firstName = "", ...resto] = partes;

  return {
    firstName,
    lastName: resto.join(" "),
  };
}

function convertirEstadoAIsActive(estado: string): boolean {
  const estadoNormalizado = estado.trim().toLowerCase();

  return (
    estadoNormalizado === "activo" ||
    estadoNormalizado === "active" ||
    estadoNormalizado === "true"
  );
}

function obtenerEstadoEditable(
  estado: Colaborador["estado"],
): "activo" | "desactivado" {
  return estado === "desactivado"
    ? "desactivado"
    : "activo";
}

export function EditarUsuarioModal({
  isOpen,
  onClose,
  colaborador,
  onSuccess,
}: EditarUsuarioModalProps) {
  const {
    updateUser,
    isLoading,
    error: updateError,
    clearError,
  } = useUpdateUser();

  const {
    options: roleOptions,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useRoles();

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
    mode: "onChange",
    defaultValues: {
      nombreCompleto: "",
      correo: "",
      nombreUsuario: "",
      rol: "",
      estado: "activo",
    },
  });

  useEffect(() => {
  if (!colaborador || !isOpen) {
    return;
  }

  clearError();

  reset({
    nombreCompleto: colaborador.nombre,
    correo: colaborador.correo,
    nombreUsuario: colaborador.correo.split("@")[0],
    rol: colaborador.roleId,
    estado: obtenerEstadoEditable(
      colaborador.estado,
    ),
  });
}, [
  colaborador,
  isOpen,
  reset,
  clearError,
]);
  
  const handleClose = () => {
    clearError();
    onClose();
  };

    const onSubmit = async (
      data: EditarUsuarioForm,
    ): Promise<void> => {
      if (!colaborador) {
        return;
      }

      const { firstName, lastName } =
        separarNombreCompleto(data.nombreCompleto);

      try {
        await updateUser(colaborador.id, {
          firstName,
          lastName,
          email: data.correo.trim().toLowerCase(),
          roleIds: [data.rol],
          isActive:
            convertirEstadoAIsActive(data.estado),
        });

        const nombreActualizado =
          data.nombreCompleto.trim();

        handleClose();
        onSuccess(nombreActualizado);
      } catch {
        // useUpdateUser muestra el error en el modal.
      }
    };

  if (!colaborador) {
    return null;
  }

  const isSaving = isSubmitting || isLoading;
  const isRoleCatalogUnavailable =
    isLoadingRoles ||
    Boolean(rolesError) ||
    roleOptions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar usuario: ${colaborador.nombre}`}
      headerDivider={false}
      size="xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="text-left"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="text-base font-semibold text-gray-900">
              Información personal
            </p>

            <FormField label="Nombre completo">
              <input
                {...register("nombreCompleto")}
                className={formInputClass}
                disabled={isSaving}
              />

              {errors.nombreCompleto && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.nombreCompleto.message}
                </p>
              )}
            </FormField>

            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <Select
                  label="Rol"
                  value={field.value}
                  onChange={field.onChange}
                  options={roleOptions}
                  placeholder={
                    isLoadingRoles
                      ? "Cargando roles..."
                      : "Seleccionar un rol"
                  }
                  disabled={
                    isSaving || isRoleCatalogUnavailable
                  }
                />
              )}
            />

            {errors.rol && (
              <p className="mt-1 text-xs text-red-500">
                {errors.rol.message}
              </p>
            )}

            {rolesError && (
              <p className="mt-1 text-xs text-red-500">
                {rolesError}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-base font-semibold text-gray-900">
              Seguridad
            </p>

            <FormField label="Correo de contacto">
              <input
                type="email"
                {...register("correo")}
                className={formInputClass}
                disabled={isSaving}
              />

              {errors.correo && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.correo.message}
                </p>
              )}
            </FormField>

           <FormField label="Nombre de usuario">
              <input
                {...register("nombreUsuario")}
                className={`${formInputClass} cursor-not-allowed bg-gray-100`}
                readOnly
                aria-readonly="true"
              />

              {errors.nombreUsuario && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.nombreUsuario.message}
                </p>
              )}
            </FormField>
          </div>
        </div>

        <div className="mt-8 max-w-40">
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                value={field.value}
                onChange={field.onChange}
                options={ESTADO_EDITABLE_OPTIONS}
                placeholder="Estados"
              />
            )}
          />

          {errors.estado && (
            <p className="mt-1 text-xs text-red-500">
              {errors.estado.message}
            </p>
          )}
        </div>

        {updateError && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {updateError}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="w-36 rounded-md border border-[#1C21D1] py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>

          <button
          type="submit"
          disabled={
            isSaving || isRoleCatalogUnavailable
          }
          className="w-36 rounded-md bg-[#1C21D1] py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
        </div>
      </form>
    </Modal>
  );
}
