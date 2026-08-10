"use client";

import { Search } from "lucide-react";
import { SearchBarProps } from "./SearchBar.types";

export function SearchBar({ value, onChange, placeholder = "Buscar", className = "" }: SearchBarProps) {
  return (
    <div
      className={`flex w-full max-w-xs items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 ${className}`}
    >
      <Search size={16} className="shrink-0 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
      />
    </div>
  );
}