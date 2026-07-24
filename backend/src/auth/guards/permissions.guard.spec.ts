import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('debe permitir acceso si no se requieren permisos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ permissions: ['read'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso si el usuario tiene todos los permisos requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read', 'delete']);
    const context = createMockContext({ permissions: ['read', 'create', 'delete'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario carece de al menos un permiso', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read', 'delete']);
    const context = createMockContext({ permissions: ['read'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe lanzar ForbiddenException si no existe usuario en la petición', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['delete']);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
