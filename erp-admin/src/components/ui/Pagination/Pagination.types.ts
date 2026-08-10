export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many pages to show around the current page. Defaults to 1. */
  siblingCount?: number;
}