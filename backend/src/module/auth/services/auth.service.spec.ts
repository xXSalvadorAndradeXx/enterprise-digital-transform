import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  UnauthorizedException,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../../users/entities/user.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { RefreshToken } from '../../users/entities/refresh-token.entity';
import { PasswordResetToken } from '../../users/entities/password-reset-token.entity';

describe('AuthService (Pruebas Unitarias de Seguridad)', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: any;
  let refreshTokenRepository: any;
  let passwordResetTokenRepository: any;
  let cartRepository: any;
  let hashService: any;

  const mockUser: User = {
    tokenVersion: 0,
    deletedAt: null,
    id: 'user-uuid-123',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cart: null as any,
    roles: [{ id: 'r1', name: 'cliente' }] as any,
    refreshTokens: [],
    passwordResetTokens: [],
  } as User;

  beforeEach(async () => {
    userRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (u) => u),
      create: jest.fn().mockImplementation((dto) => dto),
      createQueryBuilder: jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
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

    cartRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (c) => c),
    };

    hashService = {
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

  // ------------------------------------------------------------------
  // 1. REGISTRO Y ESTADO DE CUENTA (LOCKOUT 423)
  // ------------------------------------------------------------------
  describe('Estado de cuenta y Lockout (423)', () => {
    it('Prueba: login bloqueado por cuenta en lockout (423)', () => {
      const blockedUser = { ...mockUser, isBlocked: true };
      expect(() => service.checkAccountStatus(blockedUser)).toThrow(
        HttpException,
      );
      try {
        service.checkAccountStatus(blockedUser);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.LOCKED); // HTTP 423
      }
    });

    it('debe incrementar intentos fallidos y bloquear la cuenta al llegar a 3 fallos', async () => {
      const user = { ...mockUser, failedLoginAttempts: 2 };
      await expect(service.handleFailedLogin(user)).rejects.toThrow(HttpException);

      expect(user.failedLoginAttempts).toBe(3);
      expect(user.isBlocked).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  // ------------------------------------------------------------------
  // 2. ROTACIÓN Y REUTILIZACIÓN DE REFRESH TOKENS
  // ------------------------------------------------------------------
  describe('Rotación e Invalidación Masiva de Refresh Tokens', () => {
    it('Prueba: rotación exitosa de refresh token', async () => {
      const oldRawToken = 'valid.old.refresh.token';
      const oldHash = service.hashToken(oldRawToken);
      const newRawToken = 'new.raw.refresh.token';
      const newAccessToken = 'new.raw.access.token';

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
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValueOnce(newRawToken);
      jwtService.signAsync.mockResolvedValueOnce(newAccessToken);

      const result = await service.validateAndRotate(oldRawToken);

      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: newRawToken,
      });
      expect(tokenRecord.revoked).toBe(true);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(tokenRecord);
    });

    it('Prueba: detección de reutilización de refresh token e invalidación masiva', async () => {
      const reusedRawToken = 'reused.revoked.refresh.token';
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
        revoked: true,
        replacedByTokenHash: 'some_previous_replacement_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      refreshTokenRepository.findOneBy.mockResolvedValue(revokedTokenRecord);

      await expect(service.validateAndRotate(reusedRawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Invalida masivamente todas las sesiones activas del usuario
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
      );
    });
  });

  // ------------------------------------------------------------------
  // 3. CAMBIO DE CONTRASEÑA
  // ------------------------------------------------------------------
  describe('Cambio de Contraseña', () => {
    const oldPass = 'OldPass123!';
    const hashedOldPass = require('bcrypt').hashSync(oldPass, 10);
    const validNewPass = 'NewSecurePass456!';
    const weakNewPass = 'weakpass';

    it('Prueba: cambio de contraseña exitoso y limpieza de must_change_password', async () => {
      const dbUser = {
        ...mockUser,
        passwordHash: hashedOldPass,
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
      expect(dbUser.isBlocked).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith(dbUser);
    });

    it('Prueba: cambio de contraseña con contraseña actual incorrecta', async () => {
      const dbUser = {
        ...mockUser,
        passwordHash: hashedOldPass,
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
      ).rejects.toThrow(BadRequestException);
    });

    it('Prueba: cambio de contraseña con política de complejidad no cumplida', async () => {
      const dbUser = {
        ...mockUser,
        passwordHash: hashedOldPass,
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
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ------------------------------------------------------------------
  // 4. FORGOT PASSWORD (EMAIL EXISTENTE E INEXISTENTE)
  // ------------------------------------------------------------------
  describe('Forgot Password (Respuesta Genérica)', () => {
    it('Prueba: forgot-password con email existente', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com', '127.0.0.1');

      expect(result).toEqual({
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      });
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('Prueba: forgot-password con email inexistente (misma respuesta genérica)', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com', '127.0.0.1');

      expect(result).toEqual({
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      });
      expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // 5. RESET PASSWORD (VÁLIDO, EXPIRADO Y YA USADO)
  // ------------------------------------------------------------------
  describe('Reset Password (Token Válido, Expirado y Ya Usado)', () => {
    const rawToken = 'valid_raw_reset_token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const newPassword = 'NewSecretPass123!';

    it('Prueba: reset-password con token válido', async () => {
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

    it('Prueba: reset-password con token expirado', async () => {
      const expiredTokenRecord = {
        id: 'reset-uuid-2',
        userId: mockUser.id,
        tokenHash,
        used: false,
        expiresAt: new Date(Date.now() - 100000), // Ya paso la fecha de expiracion
      };

      passwordResetTokenRepository.findOneBy.mockResolvedValue(expiredTokenRecord);

      await expect(service.resetPassword(rawToken, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Prueba: reset-password con token ya usado', async () => {
      const usedTokenRecord = {
        id: 'reset-uuid-3',
        userId: mockUser.id,
        tokenHash,
        used: true, // Ya fue utilizado previamente
        expiresAt: new Date(Date.now() + 100000),
      };

      passwordResetTokenRepository.findOneBy.mockResolvedValue(usedTokenRecord);

      await expect(service.resetPassword(rawToken, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
