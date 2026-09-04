export type OrderStatus = "NEW" | "PENDING" | "ON_ROUTE" | "READY_FOR_PICKUP" | "DELIVERED" | "CANCELLED";

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
  total: string;
  deliveryType: string;
  status: OrderStatus;
  customerType: "REGISTERED" | "GUEST";
  paymentMethod: string | null;
  paymentStatus: string | null;
}

export interface AdminOrdersResponse {
  items: AdminOrderListItem[];
  summary: { newOrders: number; inProcess: number; onRoute: number };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminOrderDetail extends AdminOrderListItem {
  subtotal: string;
  discountTotal: string;
  deliveryCost: string;
  totalAmount: string;
  customerId?: string | null;
  buyer: {
    fullName: string;
    email: string | null;
    phone: string | null;
    dui: string | null;
    registeredAt: string | null;
  };
  delivery?: {
    deliveryType: string;
    departmentName?: string | null;
    districtName?: string | null;
    city?: string | null;
    addressLine?: string | null;
    branchName?: string | null;
    branchAddress?: string | null;
  };
  payment: { method: string; status: string; amount: string; cardLastFour?: string | null; cardBrand?: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    sku?: string | null;
    size?: string | null;
    color?: string | null;
    product: { commercialName: string; images?: Array<{ imageUrl: string; sortOrder: number }> } | null;
  }>;
}
