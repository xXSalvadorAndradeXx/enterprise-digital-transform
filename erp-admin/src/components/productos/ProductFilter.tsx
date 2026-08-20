"use client";

import {
  ChevronDown,
  Folder,
  ListFilter,
} from "lucide-react";

interface ProductFilterOption {
  label: string;
  value: string;
}

interface ProductFilterProps {
  type: "category" | "status";
  placeholder: string;
  value: string;
  options: ProductFilterOption[];
  onChange: (value: string) => void;
}

export function ProductFilter({
  type,
  placeholder,
  value,
  options,
  onChange,
}: ProductFilterProps) {
  const selectedOption = options.find(
    (option) => option.value === value,
  );

  const Icon =
    type === "category"
      ? Folder
      : ListFilter;

  return (
    <div className="relative min-w-[140px]">
      {/* Contenido visual del filtro */}
      <div className="pointer-events-none flex h-10 items-center justify-between gap-3 rounded-md bg-[#1C21D1] px-3 text-sm font-medium text-white">
        <span className="flex min-w-0 items-center gap-2">
          <Icon
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
        </span>

        <ChevronDown
          size={17}
          className="shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* Select nativo superpuesto */}
      <select
        aria-label={placeholder}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        <option
          value=""
          className="bg-white text-gray-900"
        >
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-white text-gray-900"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}