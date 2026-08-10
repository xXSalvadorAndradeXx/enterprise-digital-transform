export const INVENTORY_ENDPOINTS = {
  LIST: "/api/inventory",
  DETAIL: (id: string) => `/api/inventory/${id}`,
  DETAILS: (id: string) => `/api/inventory/${id}/details`,
  LOW_STOCK: "/api/inventory/low-stock",
} as const;

export const MOVEMENT_ENDPOINTS = {
  LIST: "/api/inventory-movements",
} as const;
