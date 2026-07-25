import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let usersService: any;

  beforeEach(() => {
    reflector = new Reflector();
    usersService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-uuid-1',
        permissions: ['read', 'create', 'delete'],
      }),
    };
    guard = new PermissionsGuard(reflector, usersService);
  });

  const createMockContext = (user?: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('debe permitir acceso si no se requieren permisos', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ userId: 'user-uuid-1' });
    const res = await guard.canActivate(context);
    expect(res).toBe(true);
  });

  it('debe permitir acceso si el usuario tiene todos los permisos requeridos', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read', 'delete']);
    usersService.findOne.mockResolvedValue({
      id: 'user-uuid-1',
      permissions: ['read', 'create', 'delete'],
    });
    const context = createMockContext({ userId: 'user-uuid-1' });
    const res = await guard.canActivate(context);
    expect(res).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario carece de al menos un permiso', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read', 'delete']);
    usersService.findOne.mockResolvedValue({
      id: 'user-uuid-1',
      permissions: ['read'],
    });
    const context = createMockContext({ userId: 'user-uuid-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('debe lanzar ForbiddenException si no existe usuario en la petición', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['delete']);
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

