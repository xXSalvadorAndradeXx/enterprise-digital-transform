import { ReactNode } from "react";

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Extra content between the description and the primary button, e.g. a credentials card */
  children?: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}