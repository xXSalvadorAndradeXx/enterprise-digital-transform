import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

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
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('debe estar definido', () => {
    expect(strategy).toBeDefined();
  });

  it('debe validar y extraer el payload correctamente', async () => {
    const payload = { sub: 'user-uuid-1', email: 'user@example.com', rol: 'admin' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      userId: 'user-uuid-1',
      email: 'user@example.com',
      rol: 'admin',
    });
  });
});
