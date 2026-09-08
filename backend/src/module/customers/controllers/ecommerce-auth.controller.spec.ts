import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceAuthController } from './ecommerce-auth.controller';
import { CustomersService } from '../customers.service';
import { REFRESH_TOKEN_COOKIE_NAME } from '../constants/ecommerce-auth.constant';
import type { CurrentCustomerPayload } from '../decorators/current-customer.decorator';

describe('EcommerceAuthController - Logout & Identity', () => {
  let controller: EcommerceAuthController;
  let service: any;

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      validateCredentials: jest.fn(),
      generateAccessToken: jest.fn(),
      issueRefreshToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeSession: jest.fn().mockResolvedValue(undefined),
      setRefreshTokenCookie: jest.fn(),
      clearRefreshTokenCookie: jest.fn(),
      getMyProfile: jest.fn().mockResolvedValue({
        id: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
        name: 'Carlos Eduardo Gómez',
        email: 'carlos.gomez@correo.com',
      }),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EcommerceAuthController],
      providers: [
        {
          provide: CustomersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<EcommerceAuthController>(EcommerceAuthController);
  });

  describe('POST /ecommerce/auth/logout', () => {
    it('debe revocar la sesión y limpiar la cookie cuando viene en req.cookies', async () => {
      const mockReq = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'valid_refresh_cookie_value',
        },
      } as any;
      const mockRes = {} as any;

      const result = await controller.logout(mockReq, mockRes);

      expect(service.revokeSession).toHaveBeenCalledWith('valid_refresh_cookie_value');
      expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada correctamente.',
      });
    });

    it('debe admitir refreshToken enviado en el body como alternativa y limpiar la cookie', async () => {
      const mockReq = {
        cookies: {},
        body: {
          refreshToken: 'body_refresh_token_value',
        },
      } as any;
      const mockRes = {} as any;

      const result = await controller.logout(mockReq, mockRes);

      expect(service.revokeSession).toHaveBeenCalledWith('body_refresh_token_value');
      expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
      expect(result.success).toBe(true);
    });

    it('debe ser idempotente y no fallar si no viene cookie ni body (ya estaba deslogueado)', async () => {
      const mockReq = {
        cookies: {},
        body: {},
      } as any;
      const mockRes = {} as any;

      const result = await controller.logout(mockReq, mockRes);

      expect(service.revokeSession).not.toHaveBeenCalled();
      expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada correctamente.',
      });
    });
  });

  describe('GET /ecommerce/auth/me', () => {
    it('debe delegar a getMyProfile con el cliente autenticado', async () => {
      const mockCustomer: CurrentCustomerPayload = {
        id: 'cust-123',
        customerId: 'cust-123',
        email: 'test@correo.com',
        fullName: 'Cliente Prueba',
        type: 'CUSTOMER',
      };

      const result = await controller.me(mockCustomer);

      expect(service.getMyProfile).toHaveBeenCalledWith(mockCustomer.id, mockCustomer);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Carlos Eduardo Gómez');
    });
  });

  describe('POST /ecommerce/auth/refresh', () => {
    it('debe renovar el access token y actualizar la cookie con éxito', async () => {
      const mockReq = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'valid_refresh_cookie_value',
        },
      } as any;
      const mockRes = {} as any;

      service.rotateRefreshToken.mockResolvedValue({
        rawToken: 'new_rotated_raw_token',
        cookieMaxAge: 86400,
        customerId: 'cust-123',
      });
      service.findOne.mockResolvedValue({
        id: 'cust-123',
        email: 'carlos@correo.com',
        fullName: 'Carlos Gómez',
        isActive: true,
      });
      service.generateAccessToken.mockResolvedValue('fresh_new_access_token');

      const result = await controller.refresh(mockReq, mockRes);

      expect(service.rotateRefreshToken).toHaveBeenCalledWith('valid_refresh_cookie_value', true);
      expect(service.findOne).toHaveBeenCalledWith('cust-123');
      expect(service.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cust-123', isActive: true }),
      );
      expect(service.setRefreshTokenCookie).toHaveBeenCalledWith(
        mockRes,
        'new_rotated_raw_token',
        86400,
      );

      // Respuesta estándar y sin exposición de datos privados
      expect(result).toEqual({
        success: true,
        data: {
          accessToken: 'fresh_new_access_token',
          expiresIn: 900,
        },
      });
      expect(result.data).not.toHaveProperty('password');
      expect(result.data).not.toHaveProperty('addresses');
      expect(result.data).not.toHaveProperty('email');
    });

    it('debe admitir refreshToken enviado en el body como fallback', async () => {
      const mockReq = {
        cookies: {},
        body: {
          refreshToken: 'body_refresh_token_value',
        },
      } as any;
      const mockRes = {} as any;

      service.rotateRefreshToken.mockResolvedValue({
        rawToken: 'new_token',
        cookieMaxAge: 86400,
        customerId: 'cust-123',
      });
      service.findOne.mockResolvedValue({
        id: 'cust-123',
        isActive: true,
      });
      service.generateAccessToken.mockResolvedValue('access_token_body_fallback');

      const result = await controller.refresh(mockReq, mockRes, mockReq.body);

      expect(service.rotateRefreshToken).toHaveBeenCalledWith('body_refresh_token_value', true);
      expect(result.data.accessToken).toBe('access_token_body_fallback');
    });

    it('debe limpiar la cookie y lanzar 401 SESSION_EXPIRED_OR_REVOKED si no se provee refresh token', async () => {
      const mockReq = { cookies: {} } as any;
      const mockRes = {} as any;

      try {
        await controller.refresh(mockReq, mockRes);
        fail('Se esperaba que lanzara UnauthorizedException');
      } catch (error: any) {
        expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
        expect(error.getStatus()).toBe(401);
        expect(error.getResponse().code).toBe('SESSION_EXPIRED_OR_REVOKED');
      }
    });

    it('debe limpiar la cookie y re-lanzar 401 si rotateRefreshToken falla (sesión vencida o revocada)', async () => {
      const mockReq = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'expired_or_revoked_token',
        },
      } as any;
      const mockRes = {} as any;

      const sessionExpiredError = new (require('@nestjs/common').UnauthorizedException)({
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
      });
      service.rotateRefreshToken.mockRejectedValue(sessionExpiredError);

      try {
        await controller.refresh(mockReq, mockRes);
        fail('Se esperaba que lanzara UnauthorizedException');
      } catch (error: any) {
        expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
        expect(error.getStatus()).toBe(401);
        expect(error.getResponse().code).toBe('SESSION_EXPIRED_OR_REVOKED');
      }
    });

    it('debe limpiar la cookie y lanzar 401 ACCOUNT_DISABLED si el cliente asociado está inactivo', async () => {
      const mockReq = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'valid_token_but_disabled_account',
        },
      } as any;
      const mockRes = {} as any;

      service.rotateRefreshToken.mockResolvedValue({
        rawToken: 'new_token',
        cookieMaxAge: 86400,
        customerId: 'disabled-cust-id',
      });
      service.findOne.mockResolvedValue({
        id: 'disabled-cust-id',
        isActive: false,
      });

      try {
        await controller.refresh(mockReq, mockRes);
        fail('Se esperaba que lanzara UnauthorizedException');
      } catch (error: any) {
        expect(service.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
        expect(error.getStatus()).toBe(401);
        expect(error.getResponse().code).toBe('ACCOUNT_DISABLED');
      }
    });
  });
});
