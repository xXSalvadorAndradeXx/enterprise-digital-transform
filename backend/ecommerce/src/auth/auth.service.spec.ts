import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { PasswordResetToken } from '../users/entities/password-reset-token.entity';

describe('AuthService - Refresh Tokens & Rotation', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: any;
  let refreshTokenRepository: any;
  let passwordResetTokenRepository: any;

  const mockUser: User = {
    id: 'user-uuid-123',
    nombre: 'Usuario Prueba',
    email: 'test@example.com',
    password: 'hashedpassword',
    rol: 'cliente',
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    cart: null as any,
    refreshTokens: [],
    passwordResetTokens: [],
  };

  beforeEach(async () => {
    userRepository = {
      findOneBy: jest.fn(),
      save: jest.fn().mockImplementation(async (u) => u),
    };

    refreshTokenRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (record) => record),
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    passwordResetTokenRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (record) => record),
      findOneBy: jest.fn(),
    };

    const cartRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (c) => c),
    };

    const hashService = {
      hashPassword: jest.fn().mockResolvedValue('hashedpassword'),
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Cart), useValue: cartRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepository,
        },
        { provide: HashService, useValue: hashService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_SECRET') return 'access_secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
              if (key === 'JWT_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('checkAccountStatus', () => {
    it('debe lanzar HttpException (423) si la cuenta está bloqueada por isBlocked o lockedUntil', () => {
      const user = { ...mockUser, isBlocked: true, lockedUntil: new Date() };
      expect(() => service.checkAccountStatus(user)).toThrow(HttpException);

      try {
        service.checkAccountStatus(user);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.LOCKED);
      }
    });

    it('debe permitir la ejecución si la cuenta está activa y no bloqueada', () => {
      expect(() => service.checkAccountStatus(mockUser)).not.toThrow();
    });
  });

  describe('handleFailedLogin', () => {
    it('debe incrementar el contador de intentos fallidos en 1', async () => {
      const user = { ...mockUser, failedLoginAttempts: 0 };
      await service.handleFailedLogin(user);

      expect(user.failedLoginAttempts).toBe(1);
      expect(user.isBlocked).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('debe bloquear la cuenta (lockedUntil = now, isBlocked = true) al alcanzar 3 intentos fallidos', async () => {
      const user = { ...mockUser, failedLoginAttempts: 2 };
      await service.handleFailedLogin(user);

      expect(user.failedLoginAttempts).toBe(3);
      expect(user.isBlocked).toBe(true);
      expect(user.lockedUntil).toBeInstanceOf(Date);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('debe reiniciar failedLoginAttempts a 0 y limpiar lockedUntil e isBlocked', async () => {
      const user = {
        ...mockUser,
        failedLoginAttempts: 2,
        isBlocked: true,
        lockedUntil: new Date(),
      };

      await service.handleSuccessfulLogin(user);

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.isBlocked).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('issueRefreshToken', () => {
    it('debe generar un JWT firmado (7 días), calcular su hash SHA-256 y guardarlo en BD', async () => {
      const mockRawToken = 'raw.refresh.token';
      jwtService.signAsync.mockResolvedValue(mockRawToken);

      const result = await service.issueRefreshToken(mockUser.id);

      expect(result).toBe(mockRawToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, type: 'refresh' },
        { secret: 'refresh_secret', expiresIn: '7d' },
      );
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          tokenHash: service.hashToken(mockRawToken),
          revoked: false,
          replacedByTokenHash: null,
        }),
      );
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('debe revocar todos los tokens activos del usuario', async () => {
      await service.revokeAllUserTokens(mockUser.id);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
      );
    });
  });

  describe('revokeToken', () => {
    it('debe revocar un token específico por su hash en BD', async () => {
      const rawToken = 'specific.refresh.token';
      const expectedHash = service.hashToken(rawToken);

      await service.revokeToken(rawToken);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { tokenHash: expectedHash, revoked: false },
        { revoked: true },
      );
    });
  });

  describe('validateAndRotate', () => {
    it('debe rotar el token exitosamente marcando el previo como revocado y asignando replacedByTokenHash', async () => {
      const oldRawToken = 'old.refresh.token';
      const oldHash = service.hashToken(oldRawToken);
      const newRawToken = 'new.refresh.token';
      const newAccessToken = 'new.access.token';

      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'refresh',
      });

      const tokenRecord: RefreshToken = {
        id: 'token-uuid-1',
        userId: mockUser.id,
        user: mockUser,
        tokenHash: oldHash,
        expiresAt: new Date(Date.now() + 1000000),
        revoked: false,
        replacedByTokenHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      refreshTokenRepository.findOneBy.mockResolvedValue(tokenRecord);
      userRepository.findOneBy.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValueOnce(newRawToken); // Para el nuevo Refresh Token
      jwtService.signAsync.mockResolvedValueOnce(newAccessToken); // Para el nuevo Access Token

      const result = await service.validateAndRotate(oldRawToken);

      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: newRawToken,
      });
      expect(tokenRecord.revoked).toBe(true);
      expect(tokenRecord.replacedByTokenHash).toBe(service.hashToken(newRawToken));
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(tokenRecord);
    });

    it('debe DETECTAR REUTILIZACIÓN MALICIOSA si el token ya está revocado e invalidar todos los tokens del usuario', async () => {
      const reusedRawToken = 'reused.refresh.token';
      const reusedHash = service.hashToken(reusedRawToken);

      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'refresh',
      });

      const revokedTokenRecord: RefreshToken = {
        id: 'token-uuid-1',
        userId: mockUser.id,
        user: mockUser,
        tokenHash: reusedHash,
        expiresAt: new Date(Date.now() + 1000000),
        revoked: true, // Ya fue rotado anteriormente!
        replacedByTokenHash: 'some_other_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      refreshTokenRepository.findOneBy.mockResolvedValue(revokedTokenRecord);

      await expect(service.validateAndRotate(reusedRawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Debe haber llamado a revokeAllUserTokens
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
      );
    });

    it('debe lanzar UnauthorizedException si la firma del token es inválida', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

      await expect(service.validateAndRotate('bad.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el hash del token no existe en BD', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'refresh',
      });
      refreshTokenRepository.findOneBy.mockResolvedValue(null);

      await expect(service.validateAndRotate('unknown.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    const oldPass = 'OldPass123!';
    const hashedOldPass = require('bcrypt').hashSync(oldPass, 10);
    const validNewPass = 'NewSecurePass456!';
    const weakNewPass = 'weakpass';

    it('debe actualizar la contraseña y limpiar el flag mustChangePassword a false', async () => {
      const dbUser = {
        ...mockUser,
        password: hashedOldPass,
        mustChangePassword: true,
      };

      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(dbUser),
      };
      userRepository.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.changePassword(mockUser.id, oldPass, validNewPass);

      expect(dbUser.mustChangePassword).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith(dbUser);
    });

    it('debe lanzar BadRequestException (400) si la contraseña actual no coincide', async () => {
      const dbUser = {
        ...mockUser,
        password: hashedOldPass,
        mustChangePassword: true,
      };

      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(dbUser),
      };
      userRepository.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await expect(
        service.changePassword(mockUser.id, 'WrongOldPass123!', validNewPass),
      ).rejects.toThrow(require('@nestjs/common').BadRequestException);
    });

    it('debe lanzar UnprocessableEntityException (422) si la nueva contraseña no cumple con la complejidad', async () => {
      const dbUser = {
        ...mockUser,
        password: hashedOldPass,
        mustChangePassword: true,
      };

      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(dbUser),
      };
      userRepository.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await expect(
        service.changePassword(mockUser.id, oldPass, weakNewPass),
      ).rejects.toThrow(
        require('@nestjs/common').UnprocessableEntityException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('debe generar un token, guardarlo con expiración a 30 min y retornar mensaje genérico (200) si el usuario existe', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com', '127.0.0.1');

      expect(result).toEqual({
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      });
      expect(passwordResetTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          used: false,
        }),
      );
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('debe retornar mensaje genérico (200) sin guardar token si el usuario no existe', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com', '127.0.0.2');

      expect(result).toEqual({
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      });
      expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar HttpException (429 - Too Many Requests) si se excede el rate limit', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      const email = 'rate@example.com';
      const ip = '192.168.1.100';

      await service.forgotPassword(email, ip);
      await service.forgotPassword(email, ip);
      await service.forgotPassword(email, ip);

      await expect(service.forgotPassword(email, ip)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('resetPassword', () => {
    it('debe restablecer la contraseña, marcar token como used=true y revocar los refresh tokens del usuario', async () => {
      const rawToken = 'valid_raw_reset_token';
      const tokenHash = service.hashToken(rawToken);
      const newPassword = 'NewSecretPass123!';

      const tokenRecord = {
        id: 'reset-uuid-1',
        userId: mockUser.id,
        tokenHash,
        used: false,
        expiresAt: new Date(Date.now() + 100000),
      };

      passwordResetTokenRepository.findOneBy.mockResolvedValue(tokenRecord);
      userRepository.findOneBy.mockResolvedValue({ ...mockUser });

      const result = await service.resetPassword(rawToken, newPassword);

      expect(result).toEqual({ message: 'Contraseña restablecida exitosamente' });
      expect(tokenRecord.used).toBe(true);
      expect(passwordResetTokenRepository.save).toHaveBeenCalledWith(tokenRecord);
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
      );
    });

    it('debe lanzar BadRequestException (400) si el token ya fue utilizado o ha expirado', async () => {
      const expiredRecord = {
        id: 'reset-uuid-2',
        userId: mockUser.id,
        tokenHash: 'expired_hash',
        used: true, // Ya utilizado!
        expiresAt: new Date(Date.now() - 1000),
      };

      passwordResetTokenRepository.findOneBy.mockResolvedValue(expiredRecord);

      await expect(
        service.resetPassword('used_token', 'NewSecretPass123!'),
      ).rejects.toThrow(require('@nestjs/common').BadRequestException);
    });
  });
});
