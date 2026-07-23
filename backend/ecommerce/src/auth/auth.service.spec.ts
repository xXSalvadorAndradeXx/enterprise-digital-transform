import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';

describe('AuthService - Refresh Tokens & Rotation', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: any;
  let refreshTokenRepository: any;

  const mockUser: User = {
    id: 'user-uuid-123',
    nombre: 'Usuario Prueba',
    email: 'test@example.com',
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
    userRepository = {
      findOneBy: jest.fn(),
    };

    refreshTokenRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (record) => record),
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
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
});
