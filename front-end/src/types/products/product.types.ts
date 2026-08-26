export interface ProductCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
  name?: string;
  slug?: string;
}

export type ProductGender = "MEN" | "WOMEN" | "UNISEX" | "KIDS";
export type ProductAvailability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export interface ProductDiscount { percentage: number; isActive: boolean; startsAt?: string; endsAt?: string; }
export interface ProductImage { id: string; url: string; alt: string; position?: number; }
export interface ProductVariant { id: string; sku: string; size: string; color: { name: string; hex: string }; stock: number; available: boolean; }

export interface Product {
  id: number | string;
  nombre: string;
  descripcion: string;
  precio: string | number;
  stock: number;
  imagenUrl: string;
  createdAt: string;
  deletedAt?: string | null;
  category: ProductCategory | null;
  commercialName?: string;
  description?: string;
  brand?: string;
  gender?: ProductGender;
  salePrice?: string;
  effectivePrice?: string;
  discount?: ProductDiscount | null;
  stockTotal?: number;
  availability?: ProductAvailability;
  primaryImage?: string | ProductImage | null;
  images?: Array<string | ProductImage>;
  variants?: ProductVariant[];
  tags?: string[];
}

export interface ProductsResponse {
  data: Product[];
  meta?: { total: number; page: number; limit: number; totalPages?: number };
  total?: number;
  page?: number;
  limit?: number;
}
export interface ProductDetailResponse { data: Product; }
