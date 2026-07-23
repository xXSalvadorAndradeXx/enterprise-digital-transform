import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockUser: User = {
    id: 'user-uuid-123',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'hashedpassword',
    rol: 'cliente',
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
    createdAt: new Date(),
    cart: null as any,
    refreshTokens: [],
    passwordResetTokens: [],
  };

  beforeEach(async () => {
    authService = {
      issueAccessToken: jest.fn().mockResolvedValue('access_token_123'),
      issueRefreshToken: jest.fn().mockResolvedValue('refresh_token_123'),
      validateAndRotate: jest.fn().mockResolvedValue({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      }),
      revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
      revokeToken: jest.fn().mockResolvedValue(undefined),
      checkAccountStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Cart), useValue: {} },
        { provide: HashService, useValue: {} },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('debe retornar 200 con accessToken, refreshToken, user y mustChangePassword', async () => {
      const req = { user: mockUser };
      const loginDto = { email: 'juan@example.com', password: 'password123' };

      const result = await controller.login(req, loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access_token_123');
      expect(result.refreshToken).toBe('refresh_token_123');
      expect(result.mustChangePassword).toBe(false);
      expect(result.user.email).toBe('juan@example.com');
      expect(authService.issueAccessToken).toHaveBeenCalledWith(mockUser);
      expect(authService.issueRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('refresh', () => {
    it('debe invocar validateAndRotate y retornar 200 con { accessToken, refreshToken }', async () => {
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
      expect(authService.validateAndRotate).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('debe propagar la excepción UnauthorizedException (401) ante token invalido/reutilizado', async () => {
      authService.validateAndRotate.mockRejectedValue(
        new UnauthorizedException('Token de refresco revocado o invalido'),
      );

      const refreshTokenDto = { refreshToken: 'revoked_token' };

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('debe invocar revokeToken y retornar HTTP 204 sin contenido cuando se envía RefreshTokenDto', async () => {
      const req = { user: { userId: 'user-uuid-123' } };
      const dto = { refreshToken: 'active_refresh_token' };

      const result = await controller.logout(req, dto);

      expect(result).toBeUndefined(); // 204 No Content
      expect(authService.revokeToken).toHaveBeenCalledWith('active_refresh_token');
    });

    it('debe invocar revokeAllUserTokens y retornar HTTP 204 sin contenido cuando no se envía DTO', async () => {
      const req = { user: { userId: 'user-uuid-123' } };

      const result = await controller.logout(req);

      expect(result).toBeUndefined(); // 204 No Content
      expect(authService.revokeAllUserTokens).toHaveBeenCalledWith('user-uuid-123');
    });
  });

  describe('changePassword', () => {
    it('debe invocar authService.changePassword y retornar mensaje de éxito (200)', async () => {
      authService.changePassword = jest.fn().mockResolvedValue(undefined);
      const req = { user: { id: 'user-uuid-123' } };
      const dto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass456!',
      };

      const result = await controller.changePassword(req, dto);

      expect(result).toEqual({ message: 'Contraseña actualizada exitosamente' });
      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-uuid-123',
        'OldPass123!',
        'NewSecurePass456!',
      );
    });
  });
});
