import { generateTemporaryPassword } from './security.util';

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
