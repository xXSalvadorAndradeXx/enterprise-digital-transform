import { ReactNode } from "react";

export interface EmptyStateProps {
  image: ReactNode;
  title: string;
  description: string;
  helperText?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}