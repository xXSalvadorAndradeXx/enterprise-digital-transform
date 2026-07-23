"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  siblingCount?: number;
}

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PaginationItem[] {
  if (totalPages === 0) return [];

  const safeSiblingCount = Math.max(0, Math.floor(siblingCount));
  const maxPagesWithoutEllipsis = safeSiblingCount * 2 + 3;

  if (totalPages <= maxPagesWithoutEllipsis) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set<number>([1, totalPages]);

  for (
    let page = Math.max(1, currentPage - safeSiblingCount);
    page <= Math.min(totalPages, currentPage + safeSiblingCount);
    page += 1
  ) {
    visiblePages.add(page);
  }

  const pages = [...visiblePages].sort((first, second) => first - second);
  const items: PaginationItem[] = [];

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push(index === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    items.push(page);
  });

  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
  siblingCount = 1,
}: PaginationProps) {
  const safeTotalPages = Math.max(0, Math.floor(totalPages));
  const safeCurrentPage =
    safeTotalPages === 0
      ? 0
      : Math.min(safeTotalPages, Math.max(1, Math.floor(currentPage)));
  const items = getPaginationItems(safeCurrentPage, safeTotalPages, siblingCount);

  const changePage = (page: number) => {
    if (disabled || page < 1 || page > safeTotalPages || page === safeCurrentPage) return;
    onPageChange(page);
  };

  return (
    <nav
      aria-label="Paginación"
      className={`flex min-h-8 items-center justify-center gap-1 text-sm text-black ${className}`}
    >
      <button
        type="button"
        aria-label="Ir a la página anterior"
        disabled={disabled || safeCurrentPage <= 1}
        onClick={() => changePage(safeCurrentPage - 1)}
        className="flex size-8 items-center justify-center rounded-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
      >
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={2} />
      </button>

      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`Ir a la página ${item}`}
            aria-current={item === safeCurrentPage ? "page" : undefined}
            disabled={disabled}
            onClick={() => changePage(item)}
            className="flex size-8 items-center justify-center rounded-sm aria-[current=page]:bg-[#F7F7F8] aria-[current=page]:font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="flex size-8 items-center justify-center">
            …
          </span>
        ),
      )}

      <button
        type="button"
        aria-label="Ir a la página siguiente"
        disabled={disabled || safeCurrentPage === 0 || safeCurrentPage >= safeTotalPages}
        onClick={() => changePage(safeCurrentPage + 1)}
        className="flex size-8 items-center justify-center rounded-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
      >
        <ChevronRight aria-hidden="true" size={18} strokeWidth={2} />
      </button>
    </nav>
  );
}
