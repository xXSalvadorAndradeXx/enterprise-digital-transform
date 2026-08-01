"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { SelectProps } from "./Select.types";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      required,
      value,
      onChange,
      options,
      placeholder,
      className = "",
      error,
      ...props
    },
    ref
  ) => {
    return (
      <label className={`flex flex-col gap-1 text-sm ${className}`}>
        {label && (
          <span className="font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </span>
        )}

        <span className="relative">
          <select
            ref={ref}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-9 text-sm text-gray-700 transition-colors focus:outline-none focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
            }`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </span>

        {error && (
          <span className="text-xs text-red-500">
            {error}
          </span>
        )}
      </label>
    );
  }
);

Select.displayName = "Select";