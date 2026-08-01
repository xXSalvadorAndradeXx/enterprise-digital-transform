"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationProps } from "./Pagination.types";
import { getPaginationRange } from "./getPaginationRange";

export function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = getPaginationRange(currentPage, totalPages, siblingCount);

  return (
    <nav className="flex items-center justify-end gap-1 px-4 py-4" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {range.map((item, index) =>
        item === "dots" ? (
          <span key={`dots-${index}`} className="px-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
              item === currentPage ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}