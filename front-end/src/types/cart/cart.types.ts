export interface ApiCartVariant {
  size: string;
  colorName: string;
  colorHex: string;
}

export interface ApiCartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  imageUrl: string | null;

  variant: ApiCartVariant;

  quantity: number;
  availableStock: number;

  unitPrice: string;
  lineDiscount: string;
  lineTotal: string;
}

export interface ApiCart {
  id: string;
  status: "ACTIVE";

  items: ApiCartItem[];

  subtotal: string;
  discountTotal: string;
  total: string;
}

export interface AddCartItemRequest {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemQuantityRequest {
  quantity: number;
}

export interface CartResponse {
  success: true;
  message: string;
  data: ApiCart;
  timestamp: string;
}