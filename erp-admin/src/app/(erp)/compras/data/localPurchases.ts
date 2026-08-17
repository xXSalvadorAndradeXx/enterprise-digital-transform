"use client";

export type LocalPurchaseRow = {
  id: string;
  reference: string;
  date: string;
  supplier: string;
  product: string;
  total: string;
  stockEntered: number;
  invoiceUrl: string;
  invoiceType: "image" | "pdf";
  editDetails?: {
    supplierId: string;
    purchaseDate: string;
    productId: string;
    productSku: string;
    category: string;
    variants: Array<{
      id: string;
      size: string;
      color?: string;
      quantity: string;
      unitCost: string;
    }>;
  };
};

const STORAGE_KEY = "erp_mock_purchases";
const CHANGE_EVENT = "erp-mock-purchases-change";

export const DEFAULT_LOCAL_PURCHASES: readonly LocalPurchaseRow[] = [
  {
    id: "001",
    reference: "CP-0005",
    date: "18-05-2026",
    supplier: "Nike",
    product: "nike ford",
    total: "$309.50",
    stockEntered: 100,
    invoiceUrl: "",
    invoiceType: "pdf",
  },
  {
    id: "002",
    reference: "CP-0006",
    date: "18-05-2026",
    supplier: "Nike",
    product: "nike low 1",
    total: "$105.50",
    stockEntered: 90,
    invoiceUrl: "",
    invoiceType: "pdf",
  },
];

let cachedPurchases: readonly LocalPurchaseRow[] = DEFAULT_LOCAL_PURCHASES;
let initialized = false;

function orderPurchasesForDisplay(
  rows: readonly LocalPurchaseRow[],
): readonly LocalPurchaseRow[] {
  const defaultIds = new Set(DEFAULT_LOCAL_PURCHASES.map((row) => row.id));
  const registeredRows = rows
    .filter((row) => !defaultIds.has(row.id))
    .sort((left, right) => Number(right.id) - Number(left.id));
  const defaultRows = rows.filter((row) => defaultIds.has(row.id));

  return [...registeredRows, ...defaultRows];
}

function isLocalPurchaseRow(value: unknown): value is LocalPurchaseRow {
  if (typeof value !== "object" || value === null) return false;

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.reference === "string" &&
    typeof row.date === "string" &&
    typeof row.supplier === "string" &&
    typeof row.product === "string" &&
    typeof row.total === "string" &&
    typeof row.stockEntered === "number" &&
    typeof row.invoiceUrl === "string" &&
    (row.invoiceType === "image" || row.invoiceType === "pdf")
  );
}

function initializeFromStorage(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return;

    const parsed: unknown = JSON.parse(storedValue);
    if (Array.isArray(parsed) && parsed.every(isLocalPurchaseRow)) {
      cachedPurchases = orderPurchasesForDisplay(parsed);
    }
  } catch {
    cachedPurchases = DEFAULT_LOCAL_PURCHASES;
  }
}

export function getLocalPurchasesSnapshot(): readonly LocalPurchaseRow[] {
  initializeFromStorage();
  return cachedPurchases;
}

export function getLocalPurchasesServerSnapshot(): readonly LocalPurchaseRow[] {
  return DEFAULT_LOCAL_PURCHASES;
}

export function saveLocalPurchases(rows: readonly LocalPurchaseRow[]): void {
  cachedPurchases = [...rows];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedPurchases));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function addLocalPurchase(row: LocalPurchaseRow): void {
  saveLocalPurchases([row, ...getLocalPurchasesSnapshot()]);
}

export function updateLocalPurchase(
  id: string,
  changes: Partial<Omit<LocalPurchaseRow, "id">>,
): void {
  saveLocalPurchases(
    getLocalPurchasesSnapshot().map((row) =>
      row.id === id ? { ...row, ...changes } : row,
    ),
  );
}

export function getNextLocalPurchaseIdentifiers(): {
  id: string;
  reference: string;
} {
  const rows = getLocalPurchasesSnapshot();
  const nextId =
    Math.max(
      0,
      ...rows.map((row) => {
        const value = Number.parseInt(row.id, 10);
        return Number.isFinite(value) ? value : 0;
      }),
    ) + 1;
  const nextReference =
    Math.max(
      0,
      ...rows.map((row) => {
        const value = Number.parseInt(row.reference.replace(/\D/g, ""), 10);
        return Number.isFinite(value) ? value : 0;
      }),
    ) + 1;

  return {
    id: String(nextId).padStart(3, "0"),
    reference: `CP-${String(nextReference).padStart(4, "0")}`,
  };
}

export function subscribeToLocalPurchases(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    initialized = false;
    initializeFromStorage();
    onChange();
  };

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
