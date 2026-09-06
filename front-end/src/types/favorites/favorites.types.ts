export interface FavoriteProduct {
  id: string;
  commercialName: string;
  imageUrl: string | null;
  salePrice: number | string;
  hasDiscount: boolean;
  stock: number;
  availability: string;
}

export interface Favorite {
  favoriteId: string;
  createdAt: string;
  product: FavoriteProduct;
}

export interface FavoritesQuery {
  page?: number;
  limit?: number;
}

export interface FavoritesPage {
  items: Favorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClearFavoritesData {
  deletedCount?: number;
}

export interface ClearFavoritesResult {
  deletedCount: number | null;
}
