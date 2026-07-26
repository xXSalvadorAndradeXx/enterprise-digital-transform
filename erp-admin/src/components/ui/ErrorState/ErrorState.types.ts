import { ReactNode } from "react";

export interface ErrorStateProps {
  image: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onRetry?: () => void;
  className?: string;
}