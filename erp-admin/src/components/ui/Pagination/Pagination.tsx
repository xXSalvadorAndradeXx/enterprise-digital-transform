"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationProps } from "./Pagination.types";

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const validPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);

  const items: PaginationItem[] = [];

  validPages.forEach((page, index) => {
    const previousPage = validPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(
        previousPage === 1 ? "ellipsis-start" : "ellipsis-end",
      );
    }

    items.push(page);
  });

  return items;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages,
  );
  const paginationItems = getPaginationItems(
    safeCurrentPage,
    totalPages,
  );

  return (
    <nav
      aria-label="Paginación"
      className={`flex items-center justify-end gap-2 text-[13px] ${className}`}
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={safeCurrentPage === 1}
        onClick={() => onPageChange(safeCurrentPage - 1)}
        className="flex size-8 items-center justify-center rounded text-[#4B5563] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {paginationItems.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`Ir a la página ${item}`}
            aria-current={
              safeCurrentPage === item ? "page" : undefined
            }
            onClick={() => onPageChange(item)}
            className={[
              "flex size-8 items-center justify-center rounded-md transition-colors",
              safeCurrentPage === item
                ? "bg-[#F3F4F6] font-medium text-black"
                : "text-[#374151] hover:bg-gray-100",
            ].join(" ")}
          >
            {item}
          </button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="px-1 text-[#6B7280]"
          >
            …
          </span>
        ),
      )}

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={safeCurrentPage === totalPages}
        onClick={() => onPageChange(safeCurrentPage + 1)}
        className="flex size-8 items-center justify-center rounded text-[#4B5563] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
