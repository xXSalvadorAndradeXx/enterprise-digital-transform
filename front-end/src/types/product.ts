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
  status: string;
  message: string;
  data: {
    products: Product[];
    total: number;
  };
}

export interface ProductDetailResponse {
  status: string;
  message: string;
  data: {
    product: Product;
  };
}
