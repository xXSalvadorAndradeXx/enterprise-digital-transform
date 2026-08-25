import {
  generateTemporaryPassword,
  generateGuestToken,
  hashGuestToken,
} from './security.util';

describe('security.util', () => {
  describe('generateTemporaryPassword', () => {
    it('debe generar una contraseña de la longitud correcta', () => {
      const password = generateTemporaryPassword(15);
      expect(password.length).toBe(15);
    });

    it('debe generar una contraseña con una longitud mínima de 8 caracteres si se especifica una longitud menor', () => {
      const password = generateTemporaryPassword(5);
      expect(password.length).toBe(8);
    });

    it('debe cumplir con las políticas de complejidad (mayúscula, minúscula, número, especial)', () => {
      const password = generateTemporaryPassword(12);

      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

      expect(hasUppercase).toBe(true);
      expect(hasLowercase).toBe(true);
      expect(hasDigit).toBe(true);
      expect(hasSpecial).toBe(true);
    });

    it('debe generar contraseñas aleatorias y únicas en llamadas consecutivas', () => {
      const pwd1 = generateTemporaryPassword(12);
      const pwd2 = generateTemporaryPassword(12);
      expect(pwd1).not.toBe(pwd2);
    });
  });

  describe('generateGuestToken & hashGuestToken', () => {
    it('generateGuestToken debe retornar un string hex de 64 caracteres (32 bytes)', () => {
      const token = generateGuestToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    it('hashGuestToken debe retornar el hash SHA256 en formato hex (64 caracteres)', () => {
      const token = 'guest-token-sample-123';
      const hash = hashGuestToken(token);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
      expect(hashGuestToken(token)).toBe(hash);
    });
  });
});
