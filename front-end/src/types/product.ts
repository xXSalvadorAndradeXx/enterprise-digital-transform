export interface ProductCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string | number;
  stock: number;
  imagenUrl: string;
  createdAt: string;
  deletedAt?: string | null;
  category: ProductCategory | null;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductDetailResponse {
  data: Product;
}
