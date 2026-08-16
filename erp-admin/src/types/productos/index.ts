/**
 * Tipos principales del módulo Productos.
 */

export type {
  ProductCreateStatus,
  ProductSortBy,
  ProductSortOrder,
  ProductStatus,
  ProductUpdateStatus,
} from "./product.types";


/**
 * Vista previa comercial.
 */
export type {
  ProductPreviewData,
  ProductPreviewDiscount,
  ProductPreviewImage,
} from "./product-preview.types";


/**
 * Imágenes.
 */
export type {
  ProductImage,
} from "./product-image.types";


/**
 * Variantes.
 */
export type {
  ProductVariantDetail,
} from "./product-variant.types";


/**
 * Usuario creador.
 */
export type {
  ProductCreatedBy,
} from "./product-user.types";


/**
 * Requests enviados a Backend.
 */
export type {
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
  ProductVariantConfig,
} from "./product-request.types";


/**
 * Filtros y parámetros del catálogo.
 */
export type {
  ProductQuery,
} from "./product-query.types";


/**
 * Paginación.
 */
export type {
  PaginationMeta,
} from "./pagination.types";


/**
 * Respuestas de Backend.
 */
export type {
  CreateProductResponse,
  ProductDetail,
  ProductDetailResponse,
  ProductListResponse,
  ProductSummary,
  UpdateProductResponse,
  UpdateProductStatusResponse,
} from "./product-response.types";


/**
 * Tipos utilizados por el formulario.
 */
export type {
  InventoryProductView,
  InventoryVariantView,
  ProductFormMode,
} from "./product-form.types";


/**
 * Preview local de imágenes antes
 * de subirlas a Backend.
 */
export type {
  ProductImagePreview,
} from "./product-image-form.types";