import { Supplier } from './supplier.entity';

describe('Supplier Entity', () => {
  describe('normalizePhone hook', () => {
    let supplier: Supplier;

    beforeEach(() => {
      supplier = new Supplier();
    });

    it('should format El Salvador local 8-digit number into +503XXXXXXXX', () => {
      supplier.phone = '75943334';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+50375943334');
    });

    it('should format El Salvador local number with spaces and dashes into +503XXXXXXXX', () => {
      supplier.phone = '7594-3334';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+50375943334');

      supplier.phone = '7594 3334';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+50375943334');
    });

    it('should preserve +503 when already provided with international code', () => {
      supplier.phone = '+50375943334';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+50375943334');

      supplier.phone = '+503 7594-3334';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+50375943334');
    });

    it('should normalize other international numbers with + code without altering country code', () => {
      supplier.phone = '+1 (800) 555-0199';
      supplier.normalizePhone();
      expect(supplier.phone).toBe('+18005550199');
    });

    it('should handle null without error', () => {
      supplier.phone = null;
      expect(() => supplier.normalizePhone()).not.toThrow();
      expect(supplier.phone).toBeNull();
    });

    it('should handle undefined without error', () => {
      supplier.phone = undefined;
      expect(() => supplier.normalizePhone()).not.toThrow();
      expect(supplier.phone).toBeUndefined();
    });

    it('should handle empty string without error', () => {
      supplier.phone = '';
      expect(() => supplier.normalizePhone()).not.toThrow();
      expect(supplier.phone).toBe('');
    });
  });
});
