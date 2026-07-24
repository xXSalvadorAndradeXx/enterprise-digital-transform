import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de autorización por rol.
 * Verifica que el usuario tenga AL MENOS UNO de los roles declarados
 * con @Roles() en el handler o controller.
 *
 * NOTA: El sistema usa principalmente PermissionsGuard para control granular.
 * RolesGuard se usa en casos donde se necesita protección por rol completo
 * (ej. solo SUPERADMIN puede hacer X operación sistémica).
 *
 * Uso: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('SUPERADMIN')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Rol insuficiente. Se requiere uno de: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}