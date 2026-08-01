import { ReactNode } from "react";

export interface ModalField {
  label: string;
  value: ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Simple label/value pairs — the common read-only case (e.g. viewing a team member) */
  fields?: ModalField[];
  /** Buttons/actions rendered at the bottom of the modal (e.g. Cancelar / Editar) */
  footer?: ReactNode;
  /** Use instead of `fields` for fully custom content (forms, etc.) */
  children?: ReactNode;
  /** Modal width. Defaults to "xl" (matches the existing Detalles del Colaborador modal). */
  size?: "md" | "lg" | "xl" | "2xl";
  /** Whether to show the divider line under the title. Defaults to true. */
  headerDivider?: boolean;
}