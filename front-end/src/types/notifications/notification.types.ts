export type NotificationType =
  | "ORDER_STATUS_CHANGED"
  | "FAVORITE_PRICE_DROPPED";

export type NotificationOrderRef = {
  orderNumber: string;
};

export type NotificationProductRef = {
  productId: string;
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  orderRef: NotificationOrderRef | null;
  productRef: NotificationProductRef | null;
};

export type NotificationsQuery = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
};

export type NotificationsPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type NotificationsResponse = {
  data: Notification[];
  meta: NotificationsPaginationMeta;
};
