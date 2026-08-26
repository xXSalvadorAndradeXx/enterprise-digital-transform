import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('debe estar definido el guard', () => {
    expect(guard).toBeDefined();
  });

  it('debe retornar el usuario si la autenticación fue exitosa', () => {
    const mockUser = { id: 'user-uuid-123', email: 'test@example.com' };
    const result = guard.handleRequest(null, mockUser, null);
    expect(result).toEqual(mockUser);
  });

  it('debe retornar null si ocurre un error de autenticación', () => {
    const error = new Error('Token expirado');
    const result = guard.handleRequest(error, { id: 'user-uuid-123' }, null);
    expect(result).toBeNull();
  });

  it('debe retornar null si no existe usuario (invitado)', () => {
    const result = guard.handleRequest(null, false, null);
    expect(result).toBeNull();
  });
});
