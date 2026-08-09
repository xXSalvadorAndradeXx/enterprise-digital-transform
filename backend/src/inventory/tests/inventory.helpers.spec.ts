import { calculateStockStatus } from '../helpers/stock.helper';
import { StockStatus } from '../enums/stock-status.enum';

describe('calculateStockStatus (inventory.helpers.spec)', () => {
  describe('Niveles de stock normales', () => {
    it('debe retornar BAJO cuando calculateStockStatus(5, 10)', () => {
      expect(calculateStockStatus(5, 10)).toBe(StockStatus.BAJO);
    });

    it('debe retornar MEDIO cuando calculateStockStatus(15, 10)', () => {
      expect(calculateStockStatus(15, 10)).toBe(StockStatus.MEDIO);
    });

    it('debe retornar ALTO cuando calculateStockStatus(25, 10)', () => {
      expect(calculateStockStatus(25, 10)).toBe(StockStatus.ALTO);
    });
  });

  describe('Casos límite (Edge cases)', () => {
    it('debe retornar BAJO cuando el stock es exactamente igual al minStock: calculateStockStatus(10, 10)', () => {
      expect(calculateStockStatus(10, 10)).toBe(StockStatus.BAJO);
    });

    it('debe retornar MEDIO cuando el stock es exactamente el doble del minStock: calculateStockStatus(20, 10)', () => {
      expect(calculateStockStatus(20, 10)).toBe(StockStatus.MEDIO);
    });

    it('debe retornar ALTO cuando el stock supera el doble del minStock: calculateStockStatus(21, 10)', () => {
      expect(calculateStockStatus(21, 10)).toBe(StockStatus.ALTO);
    });

    it('debe retornar BAJO cuando minStock es 0 y el stock es 0: calculateStockStatus(0, 0)', () => {
      expect(calculateStockStatus(0, 0)).toBe(StockStatus.BAJO);
    });

    it('debe retornar ALTO cuando minStock es 0 y el stock es mayor a 0: calculateStockStatus(1, 0)', () => {
      expect(calculateStockStatus(1, 0)).toBe(StockStatus.ALTO);
    });
  });
});
