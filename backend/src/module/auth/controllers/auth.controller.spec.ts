import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockUser: User = {
    id: 'user-uuid-123',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    passwordHash: 'hashedpassword',
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    cart: null as any,
    roles: [{ id: 'role-1', name: 'cliente' }] as any,
  } as unknown as User;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue({
        id: 'user-uuid-123',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        isActive: true,
        mustChangePassword: false,
      }),
      issueAccessToken: jest.fn().mockResolvedValue('access_token_123'),
      issueRefreshToken: jest.fn().mockResolvedValue('refresh_token_123'),
      handleSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
      validateAndRotate: jest.fn().mockResolvedValue({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      }),
      revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
      revokeToken: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
      forgotPassword: jest.fn().mockResolvedValue({
        message: 'Si el correo electrónico existe en nuestro sistema...',
      }),
      resetPassword: jest.fn().mockResolvedValue({
        message: 'Contraseña restablecida exitosamente',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('debe invocar authService.register y retornar el usuario creado', async () => {
      const dto = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'Password123!',
      };

      const result = await controller.register(dto);

      expect(result).toBeDefined();
      expect(result.email).toBe('juan@example.com');
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('debe retornar 200 con accessToken, refreshToken, user y flags de cambio de clave', async () => {
      const req = { user: mockUser };
      const dto = { email: 'juan@example.com', password: 'Password123!' };

      const result = await controller.login(req, dto);

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
    it('debe invocar validateAndRotate y retornar tokens rotados', async () => {
      const dto = { refreshToken: 'valid_refresh_token' };

      const result = await controller.refresh(dto);

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
      expect(authService.validateAndRotate).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('debe propagar UnauthorizedException si el token es revocado', async () => {
      authService.validateAndRotate.mockRejectedValue(
        new UnauthorizedException('Token de refresco revocado o invalido'),
      );

      const dto = { refreshToken: 'revoked_token' };

      await expect(controller.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('debe invocar revokeToken cuando se provee refreshToken en DTO', async () => {
      const req = { user: { id: 'user-uuid-123' } };
      const dto = { refreshToken: 'active_refresh_token' };

      await controller.logout(req, dto);

      expect(authService.revokeToken).toHaveBeenCalledWith('active_refresh_token');
    });

    it('debe invocar revokeAllUserTokens cuando no se envía DTO', async () => {
      const req = { user: { id: 'user-uuid-123' } };

      await controller.logout(req);

      expect(authService.revokeAllUserTokens).toHaveBeenCalledWith('user-uuid-123');
    });
  });

  describe('changePassword', () => {
    it('debe invocar authService.changePassword y retornar mensaje de éxito', async () => {
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

  describe('forgotPassword', () => {
    it('debe invocar authService.forgotPassword', async () => {
      const req = { ip: '127.0.0.1' };
      const dto = { email: 'juan@example.com' };

      const result = await controller.forgotPassword(req, dto);

      expect(result).toEqual({
        message: 'Si el correo electrónico existe en nuestro sistema...',
      });
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'juan@example.com',
        '127.0.0.1',
      );
    });
  });

  describe('resetPassword', () => {
    it('debe invocar authService.resetPassword', async () => {
      const dto = {
        token: 'raw_reset_token',
        newPassword: 'NewSecurePass456!',
      };

      const result = await controller.resetPassword(dto);

      expect(result).toEqual({ message: 'Contraseña restablecida exitosamente' });
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'raw_reset_token',
        'NewSecurePass456!',
      );
    });
  });

  describe('getProfile (GET /auth/me)', () => {
    it('debe retornar datos del usuario autenticado', () => {
      const req = {
        user: {
          id: 'user-uuid-123',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          roles: ['cliente'],
          permissions: ['read'],
        },
      };

      const result = controller.getProfile(req);

      expect(result).toEqual({
        user: {
          id: 'user-uuid-123',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
        },
        roles: ['cliente'],
        permissions: ['read'],
      });
    });
  });
});
