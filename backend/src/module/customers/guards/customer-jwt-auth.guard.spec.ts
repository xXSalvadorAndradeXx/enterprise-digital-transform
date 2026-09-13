import { UnauthorizedException } from '@nestjs/common';
import { CustomerJwtAuthGuard } from './customer-jwt-auth.guard';

describe('CustomerJwtAuthGuard - 401 & Token Expiration Handling', () => {
  let guard: CustomerJwtAuthGuard;

  beforeEach(() => {
    guard = new CustomerJwtAuthGuard();
  });

  it('debe retornar el usuario cuando la autenticación es exitosa', () => {
    const mockUser = {
      id: 'cust-123',
      email: 'carlos@test.com',
      fullName: 'Carlos Gómez',
    };

    const result = guard.handleRequest(null, mockUser, null);
    expect(result).toBe(mockUser);
  });

  it('debe lanzar UnauthorizedException (HTTP 401) con TOKEN_EXPIRED cuando el access token está expirado', () => {
    const expiredInfo = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
      expiredAt: new Date(),
    };

    try {
      guard.handleRequest(null, false, expiredInfo);
      fail('Se esperaba que lanzara UnauthorizedException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getStatus()).toBe(401);
      const response = error.getResponse();
      expect(response.code).toBe('TOKEN_EXPIRED');
      expect(response.message).toBe('El token de acceso ha expirado.');
      // Confirmar que no produce 403 ni 500
      expect(error.getStatus()).not.toBe(403);
      expect(error.getStatus()).not.toBe(500);
      // Confirmar que no expone datos sensibles
      expect(response).not.toHaveProperty('password');
      expect(response).not.toHaveProperty('hash');
    }
  });

  it('debe lanzar UnauthorizedException (HTTP 401) con UNAUTHORIZED cuando el token es inválido/malformado', () => {
    const invalidInfo = {
      name: 'JsonWebTokenError',
      message: 'invalid token',
    };

    try {
      guard.handleRequest(null, false, invalidInfo);
      fail('Se esperaba que lanzara UnauthorizedException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getStatus()).toBe(401);
      const response = error.getResponse();
      expect(response.code).toBe('UNAUTHORIZED');
      expect(response.message).toBe(
        'Acceso no autorizado. Token inválido o inexistente.',
      );
    }
  });

  it('debe lanzar UnauthorizedException (HTTP 401) con UNAUTHORIZED cuando no se envía token', () => {
    const missingInfo = new Error('No auth token');

    try {
      guard.handleRequest(null, false, missingInfo);
      fail('Se esperaba que lanzara UnauthorizedException');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getStatus()).toBe(401);
      const response = error.getResponse();
      expect(response.code).toBe('UNAUTHORIZED');
    }
  });

  it('debe propagar excepciones lanzadas en la validación (ej. ACCOUNT_DISABLED)', () => {
    const customErr = new UnauthorizedException({
      code: 'ACCOUNT_DISABLED',
      message:
        'Acceso no autorizado. La cuenta se encuentra inactiva o deshabilitada.',
    });

    try {
      guard.handleRequest(customErr, false, null);
      fail('Se esperaba que relanzara customErr');
    } catch (error: any) {
      expect(error).toBe(customErr);
      expect(error.getStatus()).toBe(401);
      expect(error.getResponse().code).toBe('ACCOUNT_DISABLED');
    }
  });
});
