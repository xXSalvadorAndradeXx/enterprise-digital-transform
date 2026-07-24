import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, HttpException, HttpStatus, BadRequestException, UnprocessableEntityException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { PasswordResetToken } from '../users/entities/password-reset-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: any;
  let refreshTokenRepository: any;
  let passwordResetTokenRepository: any;
  let cartRepository: any;
  let hashService: any;

  const mockUser: User = {
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

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const dto = {
        nombre: 'Juan Pérez',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await service.register(dto);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(userRepository.create).toHaveBeenCalled();
      expect(cartRepository.create).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el correo ya está registrado', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const dto = {
        nombre: 'Juan Pérez',
        email: 'test@example.com',
        password: 'Password123!',
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('checkAccountStatus', () => {
    it('debe lanzar HttpException (423) si la cuenta está bloqueada', () => {
      const user = { ...mockUser, isBlocked: true };
      expect(() => service.checkAccountStatus(user)).toThrow(HttpException);
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

    it('debe bloquear la cuenta al alcanzar 3 intentos fallidos', async () => {
      const user = { ...mockUser, failedLoginAttempts: 2 };
      await expect(service.handleFailedLogin(user)).rejects.toThrow(HttpException);

      expect(user.failedLoginAttempts).toBe(3);
      expect(user.isBlocked).toBe(true);
      expect(user.lockedUntil).toBeInstanceOf(Date);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

  });

  describe('handleSuccessfulLogin', () => {
    it('debe reiniciar los intentos fallidos a 0', async () => {
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
    it('debe generar un refresh token y guardarlo en BD', async () => {
      const mockRawToken = 'raw.refresh.token';
      jwtService.signAsync.mockResolvedValue(mockRawToken);

      const result = await service.issueRefreshToken(mockUser.id);

      expect(result).toBe(mockRawToken);
      expect(refreshTokenRepository.create).toHaveBeenCalled();
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

  describe('validateAndRotate', () => {
    it('debe rotar el token exitosamente', async () => {
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

    it('debe DETECTAR REUTILIZACIÓN MALICIOSA e invalidar todas las sesiones si el token ya fue revocado', async () => {
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
        revoked: true,
        replacedByTokenHash: 'some_other_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      refreshTokenRepository.findOneBy.mockResolvedValue(revokedTokenRecord);

      await expect(service.validateAndRotate(reusedRawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
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
      expect(userRepository.save).toHaveBeenCalledWith(dbUser);
    });

    it('debe lanzar BadRequestException (400) si la contraseña actual no coincide', async () => {
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

    it('debe lanzar UnprocessableEntityException (422) si la nueva contraseña no cumple con la complejidad', async () => {
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

  describe('forgotPassword', () => {
    it('debe generar token y responder con mensaje de confirmación si el usuario existe', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com', '127.0.0.1');

      expect(result).toEqual({
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      });
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('debe restablecer la contraseña exitosamente', async () => {
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
    });
  });
});
