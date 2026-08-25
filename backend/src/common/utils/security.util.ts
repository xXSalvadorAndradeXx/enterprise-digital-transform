import * as crypto from 'crypto';

/**
 * @param length Longitud de la contraseña (mínimo 8, por defecto 12)
 */
export function generateTemporaryPassword(length: number = 12): string {
  const actualLength = Math.max(length, 8);

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + digits + specialChars;

  const passwordArr: string[] = [];

  // Función interna para seleccionar un carácter aleatorio de forma segura
  const getRandomChar = (charSet: string): string => {
    const randomByte = crypto.randomBytes(1)[0];
    return charSet[randomByte % charSet.length];
  };

  // Garantizar los requisitos de complejidad mínimos
  passwordArr.push(getRandomChar(uppercase));
  passwordArr.push(getRandomChar(lowercase));
  passwordArr.push(getRandomChar(digits));
  passwordArr.push(getRandomChar(specialChars));

  // Rellenar la longitud restante
  for (let i = 4; i < actualLength; i++) {
    passwordArr.push(getRandomChar(allChars));
  }

  // Mezclar los caracteres de forma segura usando Fisher-Yates
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const randomByte = crypto.randomBytes(1)[0];
    const j = randomByte % (i + 1);
    [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
  }

  return passwordArr.join('');
}

/**
 * Genera un token aleatorio criptográficamente seguro para carritos de visitantes (hex de 32 bytes).
 */
export function generateGuestToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcula el hash SHA256 de un token de carrito de visitante.
 */
export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
