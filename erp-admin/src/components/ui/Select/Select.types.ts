import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "onChange"
  > {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;

  error?: string;
}