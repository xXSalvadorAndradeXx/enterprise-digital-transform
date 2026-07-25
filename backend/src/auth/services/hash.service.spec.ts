import { HashService } from './hash.service';

describe('HashService', () => {
  let hashService: HashService;

  beforeEach(() => {
    hashService = new HashService();
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
