import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado');
    }

    // Obtener los detalles completos del usuario y sus permisos unificados
    const userDetail = await this.usersService.findOne(user.userId);

    // Si el usuario posee el rol ADMIN o SUPERADMIN, conceder acceso total automáticamente
    const isMasterAdmin = userDetail.roles?.some(
      (role: any) => role.name === 'ADMIN' || role.name === 'SUPERADMIN',
    );
    if (isMasterAdmin) {
      return true;
    }

    const userPermissions = userDetail.permissions || [];

    // Comprobar si el usuario posee todos los permisos requeridos
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasPermission) {
      throw new ForbiddenException('Acceso denegado: No tienes permisos suficientes para realizar esta acción');
    }

    return true;
  }
}
