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
});
