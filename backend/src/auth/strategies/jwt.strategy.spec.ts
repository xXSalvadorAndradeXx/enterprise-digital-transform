import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret-key'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('debe estar definido', () => {
    expect(strategy).toBeDefined();
  });

  it('debe validar y extraer el payload correctamente', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'user@example.com',
      isActive: true,
      isBlocked: false,
      lockedUntil: null,
      tokenVersion: 1,
      roles: [{ name: 'admin', permissions: [{ code: 'read:all' }] }],
    });

    const payload = { sub: 'user-uuid-1', email: 'user@example.com', rol: 'admin', tokenVersion: 1 };
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      id: 'user-uuid-1',
      userId: 'user-uuid-1',
      email: 'user@example.com',
      rol: 'admin',
      roles: ['admin'],
      permissions: ['read:all'],
    });
  });
});
