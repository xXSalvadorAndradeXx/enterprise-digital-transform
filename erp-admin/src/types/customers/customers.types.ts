import type {
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

export const ORDER_STATUS_VALUES = [
  "NEW",
  "PENDING",
  "ON_ROUTE",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
] as const;

export type AdminCustomerSortBy =
  (typeof ADMIN_CUSTOMER_SORT_BY_VALUES)[number];

export type SortOrder =
  (typeof SORT_ORDER_VALUES)[number];

export type OrderStatus =
  (typeof ORDER_STATUS_VALUES)[number];

export interface AdminCustomerListItem {
  id: string;
  fullName: string;
  email: string;
  lastOrderAt: string | null;
  totalOrders: number;
  totalSpent: string;
}

export interface AdminCustomerLocationRef {
  id: string | number;
  name: string;
}

export interface AdminCustomerAddress {
  id: string;
  label: string;
  department: AdminCustomerLocationRef;
  district: AdminCustomerLocationRef;
  city: string | null;
  addressLine: string;
  isDefault: boolean;
}

export interface AdminCustomerDetail
  extends AdminCustomerListItem {
  dui: string;
  phone: string;
  isActive: boolean;
  addresses: AdminCustomerAddress[];
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

export interface AdminCustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: string;
  status: OrderStatus;
}

export interface AdminCustomerOrdersQuery {
  page?: number;
  limit?: number;
}

export type AdminCustomerListData =
  PaginatedData<AdminCustomerListItem>;

export type AdminCustomerListResponse =
  AdminCustomerApiSuccess<AdminCustomerListData>;

export type AdminCustomerDetailResponse =
  AdminCustomerApiSuccess<AdminCustomerDetail>;

export type AdminCustomerOrdersData =
  PaginatedData<AdminCustomerOrderHistoryItem>;

export type AdminCustomerOrdersResponse =
  AdminCustomerApiSuccess<AdminCustomerOrdersData>;

interface AdminCustomerApiSuccess<T> {
  success: true;
  data: T;
}
