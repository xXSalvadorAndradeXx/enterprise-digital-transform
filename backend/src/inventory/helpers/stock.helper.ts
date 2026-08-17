import { StockStatus } from '../enums/stock-status.enum';

/**
 * RN-I-004: Calcula el estado del stock a partir de la cantidad disponible y el stock mínimo.
 *
 * Reglas de negocio:
 * - StockStatus.BAJO: Cuando stock <= minStock (incluye stock = 0).
 * - StockStatus.MEDIO: Cuando stock > minStock y stock <= minStock * 2.
 * - StockStatus.ALTO: Cuando stock > minStock * 2.
 *
 * Comportamiento específico para el caso límite minStock = 0:
 * - Si stock === 0 (o <= 0): Retorna StockStatus.BAJO (indica sin stock disponible / agotado).
 * - Si stock > 0: Retorna StockStatus.ALTO (al no requerirse un stock mínimo, cualquier existencia positiva es considerada óptima/alta).
 *
 * @param stock - La cantidad de stock actual en inventario.
 * @param minStock - El stock mínimo de referencia.
 * @returns El estado del stock (ALTO, MEDIO o BAJO).
 */
// RN-I-004
export function calculateStockStatus(
  stock: number,
  minStock: number,
): StockStatus {
  // Caso 1: Stock menor o igual al mínimo requerido (incluye stock <= 0 cuando minStock = 0)
  if (stock <= minStock) {
    return StockStatus.BAJO;
  }
  // Caso 2: Stock por encima del mínimo pero dentro del doble del umbral
  if (stock <= minStock * 2) {
    return StockStatus.MEDIO;
  }
  // Caso 3: Stock óptimo/alto (incluye stock > 0 cuando minStock = 0)
  return StockStatus.ALTO;
}
