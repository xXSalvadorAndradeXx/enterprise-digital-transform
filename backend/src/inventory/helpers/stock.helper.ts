import { StockStatus } from '../enums/stock-status.enum';

/**
 * Calcula el estado del stock a partir de la cantidad disponible y el stock mínimo.
 * 
 * Reglas de negocio:
 * - StockStatus.BAJO cuando stock <= minStock.
 * - StockStatus.MEDIO cuando stock > minStock y stock <= minStock * 2.
 * - StockStatus.ALTO para cualquier otro caso.
 *
 * @param stock - La cantidad de stock actual en inventario.
 * @param minStock - El stock mínimo de referencia.
 * @returns El estado del stock (ALTO, MEDIO o BAJO).
 */
export function calculateStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= minStock) {
    return StockStatus.BAJO;
  }
  if (stock <= minStock * 2) {
    return StockStatus.MEDIO;
  }
  return StockStatus.ALTO;
}
