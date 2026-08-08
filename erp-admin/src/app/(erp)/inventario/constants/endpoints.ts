export const INVENTORY_ENDPOINTS = {
  LIST: "/inventory",
  DETAIL: (id: string) => `/inventory/${id}`,
  DETAILS: (id: string) => `/inventory/${id}/details`,
  LOW_STOCK: "/inventory/low-stock",
} as const;

export const MOVEMENT_ENDPOINTS = {
  LIST: "/inventory-movements",
  DETAIL: (id: string) => `/inventory-movements/${id}`,
  ADJUSTMENTS: "/inventory-movements/adjustments",
} as const;