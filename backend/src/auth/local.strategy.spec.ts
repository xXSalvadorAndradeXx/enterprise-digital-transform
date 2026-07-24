import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LocalStrategy } from './local.strategy';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let userRepository: any;
  let authService: any;

  // Generamos un hash bcrypt real de 'password123'
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const mockUser: User = {
    id: 'user-uuid-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    passwordHash: hashedPassword,
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    cart: null as any,
  } as User;

  beforeEach(async () => {
    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };


    authService = {
      checkLockout: jest.fn().mockImplementation((user: User) => {
        if (user.isBlocked) {
          throw new HttpException('La cuenta se encuentra bloqueada por múltiples intentos fallidos', HttpStatus.LOCKED);
        }
        if (!user.isActive) {
          throw new UnauthorizedException('La cuenta se encuentra inactiva');
        }
      }),
      handleFailedLogin: jest.fn().mockResolvedValue(undefined),
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('debe autenticar correctamente con credenciales válidas', async () => {
    const qb = userRepository.createQueryBuilder();
    qb.getOne.mockResolvedValue(mockUser);

    const result = await strategy.validate('juan@example.com', 'password123');

    expect(result).toBeDefined();
    expect(result.email).toBe('juan@example.com');
    expect(result.passwordHash).toBeUndefined();
    expect(authService.checkLockout).toHaveBeenCalledWith(mockUser);
  });

  it('debe lanzar UnauthorizedException (401) si el usuario no existe', async () => {
    const qb = userRepository.createQueryBuilder();
    qb.getOne.mockResolvedValue(null);

    await expect(strategy.validate('wrong@example.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException (401) si la contraseña es incorrecta', async () => {
    const qb = userRepository.createQueryBuilder();
    qb.getOne.mockResolvedValue(mockUser);

    await expect(strategy.validate('juan@example.com', 'wrongpassword')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar HttpException (423 - Locked) si la cuenta del usuario está bloqueada', async () => {
    const blockedUser = { ...mockUser, isBlocked: true };
    const qb = userRepository.createQueryBuilder();
    qb.getOne.mockResolvedValue(blockedUser);

    await expect(strategy.validate('juan@example.com', 'password123')).rejects.toThrow(
      HttpException,
    );

    try {
      await strategy.validate('juan@example.com', 'password123');
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.LOCKED); // 423
    }
  });
});

