"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useCreateUser } from "@/hooks/equipo/useCreateUser";
import { useRoles } from "@/hooks/equipo/useRoles";
import {
  agregarPersonaSchema,
  type AgregarPersonaForm,
} from "@/types/equipo/schemas";

import { FormField, formInputClass } from "./formPrimitives";

export interface AgregarPersonaResult {
  usuario: string;
  contrasenaTemporal: string;
}

export interface AgregarPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: AgregarPersonaResult) => void;
}

export function AgregarPersonaModal({
  isOpen,
  onClose,
  onSuccess,
}: AgregarPersonaModalProps) {
  const {
    createUser,
    isLoading,
    error: createUserError,
    clearError,
  } = useCreateUser();

  const {
    options: roleOptions,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useRoles();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: {
      errors,
      isValid,
      isSubmitting,
    },
  } = useForm<AgregarPersonaForm>({
    resolver: zodResolver(agregarPersonaSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellido: "",
      correo: "",
      rol: "",
      telefono: "",
    },
  });

  const telefonoField = register("telefono");

  const handleClose = () => {
  clearError();
  reset();
  onClose();
};

    const onSubmit = async (
      data: AgregarPersonaForm,
    ): Promise<void> => {
      try {
        const response = await createUser({
          firstName: data.nombre.trim(),
          lastName: data.apellido.trim(),
          email: data.correo.trim().toLowerCase(),
          roleIds: [data.rol],
        });

        onSuccess({
          usuario: `${data.nombre} ${data.apellido}`.trim(),
          contrasenaTemporal:
            response.temporaryPassword,
        });

        handleClose();
      } catch {
      }
    };

  const isSaving = isSubmitting || isLoading;
  const isRoleCatalogUnavailable =
    isLoadingRoles ||
    Boolean(rolesError) ||
    roleOptions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar persona"
      headerDivider={false}
      size="lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 text-left"
      >
        <p className="-mt-2 text-sm text-gray-500">
          Completa la información para agregar un
          miembro al equipo.
        </p>

        <FormField label="Nombre" required>
          <input
            {...register("nombre")}
            placeholder="Carlos Antonio"
            className={formInputClass}
            disabled={isSaving}
          />

          {errors.nombre && (
            <p className="mt-1 text-xs text-red-500">
              {errors.nombre.message}
            </p>
          )}
        </FormField>

        <FormField label="Apellido" required>
          <input
            {...register("apellido")}
            placeholder="Cruz Ramírez"
            className={formInputClass}
            disabled={isSaving}
          />

          {errors.apellido && (
            <p className="mt-1 text-xs text-red-500">
              {errors.apellido.message}
            </p>
          )}
        </FormField>

        <FormField
          label="Correo electrónico"
          required
        >
          <input
            type="email"
            {...register("correo")}
            placeholder="carlosR4522@gmail.com"
            className={formInputClass}
            disabled={isSaving}
          />

          {errors.correo && (
            <p className="mt-1 text-xs text-red-500">
              {errors.correo.message}
            </p>
          )}
        </FormField>

        <div>
          <Controller
            name="rol"
            control={control}
            render={({ field }) => (
              <Select
                label="Rol"
                required
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

        <FormField label="Teléfono" required>
          <input
            {...telefonoField}
            placeholder="6123-4322"
            maxLength={9}
            className={formInputClass}
            disabled={isSaving}
            onChange={(event) => {
              let value =
                event.target.value.replace(
                  /\D/g,
                  "",
                );

              if (value.length > 4) {
                value = `${value.slice(
                  0,
                  4,
                )}-${value.slice(4, 8)}`;
              }

              event.target.value = value;
              telefonoField.onChange(event);
            }}
          />

          {errors.telefono && (
            <p className="mt-1 text-xs text-red-500">
              {errors.telefono.message}
            </p>
          )}
        </FormField>

        {createUserError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2"
          >
            <p className="text-sm text-red-700">
              {createUserError}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="w-36 rounded-md border border-[#1C21D1] px-4 py-2 text-sm font-medium text-[#1C21D1] hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              !isValid ||
              isSaving ||
              isRoleCatalogUnavailable
            }
            className="w-36 rounded-md bg-[#1C21D1] px-4 py-2 text-sm font-medium text-white hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Guardando..."
              : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
