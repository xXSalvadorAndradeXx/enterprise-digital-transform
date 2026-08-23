import type { Product } from "@/types/products/product.types";

export interface ApiCartItem {
  id: number;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product: Product;
}

export interface ApiCart {
  id: number;
  createdAt: string;
  items?: ApiCartItem[];
  total?: string | number;
}

export interface CartResponse {
  data: ApiCart;
}
