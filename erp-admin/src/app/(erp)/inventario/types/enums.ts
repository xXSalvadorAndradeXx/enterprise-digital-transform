
 
export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}
export enum StockStatus {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAJO = 'BAJO',
}
export enum MovementType {
  NUEVO_PRODUCTO = 'NUEVO_PRODUCTO',
  REABASTECIMIENTO = 'REABASTECIMIENTO',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  DEVOLUCION = 'DEVOLUCION',
}
export enum MovementDirection {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}
export enum MovementChannel {
  TIENDA_FISICA = 'TIENDA_FISICA',
  ECOMMERCE = 'ECOMMERCE',
}
export enum ReferenceType {
  PURCHASE = 'PURCHASE',
  ORDER = 'ORDER',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}
export enum InventorySortBy {
  CREATED_AT = 'created_at',
  PRODUCT_NAME = 'product_name',
  STATUS = 'status',
}
export enum MovementSortBy {
  CREATED_AT = 'created_at',
}
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}