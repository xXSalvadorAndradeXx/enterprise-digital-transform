import type { OrderStatus } from "@/types/orders";

export const statusColors: Record<OrderStatus, { backgroundColor: string; color: string }> = {
  NEW: { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
  PENDING: { backgroundColor: "#FEF3C7", color: "#A16207" },
  ON_ROUTE: { backgroundColor: "#EDE9FE", color: "#6D28D9" },
  READY_FOR_PICKUP: { backgroundColor: "#D1FAE5", color: "#047857" },
  DELIVERED: { backgroundColor: "#DCFCE7", color: "#15803D" },
  CANCELLED: { backgroundColor: "#FEE2E2", color: "#DC2626" },
};
