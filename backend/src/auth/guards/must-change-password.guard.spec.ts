import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MustChangePasswordGuard } from './must-change-password.guard';

describe('MustChangePasswordGuard', () => {
  let guard: MustChangePasswordGuard;

  beforeEach(() => {
    guard = new MustChangePasswordGuard();
  });

  const createMockContext = (user?: any, url: string = '/products'): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, url }),
      }),
    }) as unknown as ExecutionContext;

  it('debe permitir el acceso a cualquier ruta si el usuario no tiene el flag mustChangePassword activo', () => {
    const context = createMockContext({ mustChangePassword: false }, '/products');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir el acceso a /auth/change-password aun cuando mustChangePassword es true', () => {
    const context = createMockContext({ mustChangePassword: true }, '/auth/change-password');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir el acceso a /auth/logout aun cuando mustChangePassword es true', () => {
    const context = createMockContext({ mustChangePassword: true }, '/auth/logout');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException (403) al intentar acceder a otra ruta con mustChangePassword en true', () => {
    const context = createMockContext({ mustChangePassword: true }, '/products');
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
