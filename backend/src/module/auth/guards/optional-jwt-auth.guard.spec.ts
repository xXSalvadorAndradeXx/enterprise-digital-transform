import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('handleRequest should return user if valid user provided', () => {
    const mockUser = { userId: 'user-uuid-1' };
    const result = guard.handleRequest(null, mockUser);
    expect(result).toEqual(mockUser);
  });

  it('handleRequest should return null if error or no user', () => {
    const result = guard.handleRequest(new Error('JWT Error'), null);
    expect(result).toBeNull();
  });
});
