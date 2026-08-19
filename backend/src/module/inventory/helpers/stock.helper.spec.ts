import { calculateStockStatus } from './stock.helper';
import { StockStatus } from '../enums/stock-status.enum';

describe('calculateStockStatus', () => {
  // Casos normales
  describe('Casos normales', () => {
    it('debe retornar StockStatus.ALTO cuando el stock es holgadamente mayor al doble de minStock', () => {
      expect(calculateStockStatus(15, 5)).toBe(StockStatus.ALTO);
      expect(calculateStockStatus(100, 10)).toBe(StockStatus.ALTO);
    });

    it('debe retornar StockStatus.MEDIO cuando el stock es mayor al minStock pero menor o igual al doble', () => {
      expect(calculateStockStatus(8, 5)).toBe(StockStatus.MEDIO);
      expect(calculateStockStatus(15, 10)).toBe(StockStatus.MEDIO);
    });

    it('debe retornar StockStatus.BAJO cuando el stock es menor al minStock', () => {
      expect(calculateStockStatus(3, 5)).toBe(StockStatus.BAJO);
      expect(calculateStockStatus(1, 10)).toBe(StockStatus.BAJO);
    });
  });

  // Casos límite (edge cases)
  describe('Casos límite (edge cases)', () => {
    it('debe retornar StockStatus.BAJO cuando el stock es exactamente igual a minStock', () => {
      expect(calculateStockStatus(5, 5)).toBe(StockStatus.BAJO);
      expect(calculateStockStatus(10, 10)).toBe(StockStatus.BAJO);
    });

    it('debe retornar StockStatus.MEDIO cuando el stock es exactamente igual a minStock * 2', () => {
      expect(calculateStockStatus(10, 5)).toBe(StockStatus.MEDIO);
      expect(calculateStockStatus(20, 10)).toBe(StockStatus.MEDIO);
    });

    it('debe retornar StockStatus.BAJO cuando el stock es exactamente 0 y minStock es mayor a 0', () => {
      expect(calculateStockStatus(0, 5)).toBe(StockStatus.BAJO);
      expect(calculateStockStatus(0, 1)).toBe(StockStatus.BAJO);
    });

    it('debe retornar StockStatus.BAJO cuando el stock es 0 y el minStock es 0', () => {
      expect(calculateStockStatus(0, 0)).toBe(StockStatus.BAJO);
    });

    it('debe retornar StockStatus.ALTO cuando el stock es mayor a 0 y el minStock es 0', () => {
      expect(calculateStockStatus(5, 0)).toBe(StockStatus.ALTO);
      expect(calculateStockStatus(1, 0)).toBe(StockStatus.ALTO);
    });
  });
});
