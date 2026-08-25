import { HashService } from './hash.service';
import { ConfigService } from '@nestjs/config';

describe('HashService', () => {
  let hashService: HashService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('10'),
    } as any;
    hashService = new HashService(mockConfigService);
  });

  it('debe generar un hash y poder verificar la contraseña', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);

    const isMatch = await hashService.comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isInvalidMatch = await hashService.comparePassword('WrongPassword', hash);
    expect(isInvalidMatch).toBe(false);
  });
});
