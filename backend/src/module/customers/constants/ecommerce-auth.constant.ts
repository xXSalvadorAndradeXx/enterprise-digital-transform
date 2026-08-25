// src/module/customers/constants/ecommerce-auth.constant.ts
import * as crypto from 'crypto';

/** Duración absoluta máxima de cualquier sesión de autenticación ecommerce (24 horas) */
export const SESSION_ABSOLUTE_MAX_TTL_SECONDS = 86_400; // 24h

/**
 * Max-Age de la cookie cuando rememberMe = false.
 * La cookie se comporta como sesión de navegador (no se persiste al cerrar).
 */
export const COOKIE_TTL_SHORT: number | undefined = undefined;

/**
 * Max-Age de la cookie cuando rememberMe = true.
 * La cookie persiste en el navegador durante las 24 horas que dura la sesión.
 */
export const COOKIE_TTL_LONG_SECONDS = SESSION_ABSOLUTE_MAX_TTL_SECONDS; // 24h

/** Path restringido de la cookie del refresh token */
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/ecommerce/auth';

/** Nombre de la cookie que almacena el refresh token */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Genera la configuración de la cookie del refresh token.
 */
export function buildRefreshTokenCookieOptions(
  maxAgeSeconds: number | undefined,
  isProduction: boolean,
) {
  const options: Record<string, any> = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: REFRESH_TOKEN_COOKIE_PATH,
    secure: isProduction,
  };

  if (maxAgeSeconds !== undefined) {
    options.maxAge = maxAgeSeconds * 1000;
  }

  return options;
}

/**
 * Genera el SHA-256 hash de un token para almacenamiento seguro en BD.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
