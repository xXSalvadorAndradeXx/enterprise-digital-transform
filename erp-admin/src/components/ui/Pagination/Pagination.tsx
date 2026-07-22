"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationProps } from "./Pagination.types";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) => {
  return (
    <div
      className={`flex items-center justify-end gap-2 text-[13px] ${className}`}
    >
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded
          text-[#4B5563]
          hover:bg-gray-100
          disabled:opacity-40
          disabled:cursor-not-allowed
        "
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={() => onPageChange(1)}
        className={`
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-md
          transition-colors
          ${
            currentPage === 1
              ? "bg-[#F3F4F6] font-medium text-black"
              : "hover:bg-gray-100 text-[#374151]"
          }
        `}
      >
        1
      </button>

      <button
        onClick={() => onPageChange(2)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[#374151] hover:bg-gray-100"
      >
        2
      </button>

      <button
        onClick={() => onPageChange(3)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[#374151] hover:bg-gray-100"
      >
        3
      </button>

      <span className="px-1 text-[#6B7280]">
        ...
      </span>

      <button
        onClick={() => onPageChange(totalPages - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[#374151] hover:bg-gray-100"
      >
        {totalPages - 1}
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[#374151] hover:bg-gray-100"
      >
        {totalPages}
      </button>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded
          text-[#4B5563]
          hover:bg-gray-100
          disabled:opacity-40
          disabled:cursor-not-allowed
        "
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;