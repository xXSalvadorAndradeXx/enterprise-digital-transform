"use client";

import { Search } from "lucide-react";

export interface SearchBarProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  placeholder,
  onChange,
  ariaLabel,
  disabled = false,
  className = "",
}: SearchBarProps) {
  return (
    <label
      className={`flex h-11 items-center gap-2 rounded-[5px] border border-[#878A92] bg-white px-[14px] text-black focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1C21D1] has-disabled:cursor-not-allowed has-disabled:opacity-50 ${className}`}
    >
      <Search aria-hidden="true" className="shrink-0" size={20} strokeWidth={2} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#878A92] disabled:cursor-not-allowed"
      />
    </label>
  );
}
