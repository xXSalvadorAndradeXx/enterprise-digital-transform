import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const buildContext = (
    userPermissions: string[],
    requiredPermissions: string[] | undefined,
  ): ExecutionContext => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions),
    } as unknown as Reflector;

    guard = new PermissionsGuard(reflector);

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: 'user-uuid', permissions: userPermissions },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso cuando el usuario tiene el permiso requerido', () => {
    const ctx = buildContext(['products:read'], ['products:read']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('debe permitir acceso cuando no hay @Permissions() declarado', () => {
    const ctx = buildContext([], undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('debe denegar acceso cuando falta un permiso', () => {
    const ctx = buildContext(['products:read'], ['products:create']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('debe requerir TODOS los permisos declarados', () => {
    const ctx = buildContext(
      ['products:read'],
      ['products:read', 'products:create'],
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('debe permitir si el usuario tiene todos los permisos requeridos', () => {
    const ctx = buildContext(
      ['products:read', 'products:create'],
      ['products:read', 'products:create'],
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('debe lanzar ForbiddenException si no hay usuario en el request', () => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['products:read']),
    } as unknown as Reflector;
    guard = new PermissionsGuard(reflector);

    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});