"use client";

import { Search } from "lucide-react";
import { SearchBarProps } from "./SearchBar.types";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Buscar Proveedor",
  disabled = false,
  className = "",
}: SearchBarProps) => {
  return (
    <div className={`relative w-[382px] ${className}`}>
      <Search
        size={16}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
      />

      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          h-[42px]
          w-full
          rounded-[4px]
          border
          border-[#808080]
          bg-white
          pl-11
          pr-4
          text-[14px]
          font-normal
          text-[#1F2937]
          placeholder:text-[#6B7280]
          outline-none
          transition-all
          focus:border-[#4F46E5]
          focus:ring-1
          focus:ring-[#4F46E5]
          disabled:bg-gray-100
          disabled:cursor-not-allowed
        "
      />
    </div>
  );
};

export default SearchBar;