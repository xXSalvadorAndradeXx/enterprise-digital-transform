export type PaginationItem = number | "dots";

/**
 * Builds a page list like: 1 2 … 23 24
 * Always shows `boundaryCount` pages at the start and end, plus `siblingCount`
 * pages around the current page, collapsing gaps into a single "dots" entry.
 */
export function getPaginationRange(
  current: number,
  total: number,
  siblingCount = 1,
  boundaryCount = 2
): PaginationItem[] {
  const totalNumbers = boundaryCount * 2 + siblingCount * 2 + 3;

  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, boundaryCount + 1);
  const rightSibling = Math.min(current + siblingCount, total - boundaryCount);

  const showLeftDots = leftSibling > boundaryCount + 2;
  const showRightDots = rightSibling < total - boundaryCount - 1;

  const startPages = Array.from({ length: boundaryCount }, (_, i) => i + 1);
  const endPages = Array.from({ length: boundaryCount }, (_, i) => total - boundaryCount + i + 1);

  const middle: PaginationItem[] = [];
  if (showLeftDots) middle.push("dots");

  for (
    let page = Math.max(leftSibling, boundaryCount + 1);
    page <= Math.min(rightSibling, total - boundaryCount);
    page++
  ) {
    if (!startPages.includes(page) && !endPages.includes(page)) middle.push(page);
  }

  if (showRightDots) middle.push("dots");

  return [...startPages, ...middle, ...endPages];
}