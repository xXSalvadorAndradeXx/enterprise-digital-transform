import { CheckCircle2, LockKeyhole, MinusCircle } from "lucide-react";
import type { StatusTone } from "@/components/ui/StatusDot";
import type { SelectOption } from "@/components/ui/Select";

export type EstadoColaborador = "activo" | "desactivado" | "bloqueado_intento";

export interface Colaborador {
  id: string;
  nombre: string;
  correo: string;
  roleId: string;
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

/**
 * Opciones del campo Estado en el formulario de Editar. Solo Activo/Desactivado
 * son editables manualmente aquí — los estados de bloqueo se gestionan aparte,
 * desde el modal de desbloqueo (UnlockUserModal).
 */
export const ESTADO_EDITABLE_OPTIONS: SelectOption[] = [
  { value: "activo", label: "Activo" },
  { value: "desactivado", label: "Desactivado" },
];
