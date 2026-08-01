import type { Colaborador } from "@/types/equipo";

export type BulkActionType = "deactivate" | "delete";

export interface BulkActionConfirmModalProps {
  isOpen: boolean;
  action: BulkActionType;
  users: Colaborador[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}