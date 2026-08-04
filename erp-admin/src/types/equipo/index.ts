import { CheckCircle2, LockKeyhole, MinusCircle } from "lucide-react";
import type { StatusTone } from "@/components/ui/StatusDot";
import type { SelectOption } from "@/components/ui/Select";

export type EstadoColaborador = "activo" | "desactivado" | "bloqueado_intento";

export interface Colaborador {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  estado: EstadoColaborador;
  fecha: string;
}

interface EstadoConfig {
  label: string;
  tone: StatusTone;
  icon: typeof CheckCircle2;
}

/** Maps each Equipo status to how StatusDot should render it. */
export const ESTADO_COLABORADOR_CONFIG: Record<
  EstadoColaborador,
  EstadoConfig
> = {
  activo: {
    label: "Activo",
    tone: "success",
    icon: CheckCircle2,
  },
  desactivado: {
    label: "Desactivado",
    tone: "neutral",
    icon: MinusCircle,
  },
  bloqueado_intento: {
    label: "Bloqueado",
    tone: "danger",
    icon: LockKeyhole,
  },
};;

/** Opciones del campo Rol en los formularios de Agregar/Editar. */
export const ROL_OPTIONS = [
  {
    value: "d27c2af6-832f-41e7-8379-a656fe0b8c48",
    label: "Administrador",
  },
  {
    value: "7aada40a-f15b-4ec6-87de-9686c3c6d5df",
    label: "Empleado",
  },
];
/**
 * Opciones del campo Estado en el formulario de Editar. Solo Activo/Desactivado
 * son editables manualmente aquí — los estados de bloqueo se gestionan aparte,
 * desde el modal de desbloqueo (UnlockUserModal).
 */
export const ESTADO_EDITABLE_OPTIONS: SelectOption[] = [
  { value: "activo", label: "Activo" },
  { value: "desactivado", label: "Desactivado" },
];