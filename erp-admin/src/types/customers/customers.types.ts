import type {
  ApiSuccess,
  PaginatedData,
} from "@/types/api-contract.types";

export const ADMIN_CUSTOMER_SORT_BY_VALUES = [
  "fullName",
  "lastOrderAt",
  "totalSpent",
  "totalOrders",
] as const;

export const SORT_ORDER_VALUES = [
  "ASC",
  "DESC",
] as const;

export type AdminCustomerSortBy =
  (typeof ADMIN_CUSTOMER_SORT_BY_VALUES)[number];

export type SortOrder =
  (typeof SORT_ORDER_VALUES)[number];

export interface AdminCustomerListItem {
  id: string;
  fullName: string;
  email: string;
  lastOrderAt: string;
  totalOrders: number;
  totalSpent: string;
}

export interface AdminCustomersQuery {
  search?: string;
  lastOrderFrom?: string;
  lastOrderTo?: string;
  page?: number;
  limit?: number;
  sortBy?: AdminCustomerSortBy;
  order?: SortOrder;
}

export type AdminCustomerListData =
  PaginatedData<AdminCustomerListItem>;

export type AdminCustomerListResponse =
  ApiSuccess<AdminCustomerListData>;
