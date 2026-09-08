import type {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
} from "@/types/checkout/checkout.types";

export type OrderListItem = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  total: number;
  itemsCount: number;
  items: OrderListItemArticle[];
};

export type OrderListItemArticle = {
  productId: string | null;
  commercialName: string;
  imageUrl: string | null;
  quantity: number;
};

export type OrderStatusFilter = OrderStatus;

export type OrderSortOrder = "ASC" | "DESC";

export type OrdersQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatusFilter;
  sortOrder?: OrderSortOrder;
};

export type OrdersPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OrdersResponse = {
  data: OrderListItem[];
  meta: OrdersPaginationMeta;
};