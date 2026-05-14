import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector permite leer la metadata del decorador @Roles
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),  // metadata del método
      context.getClass(),    // metadata de la clase
    ]);

    // Si no hay @Roles, el endpoint no requiere rol específico
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // 2. Obtener usuario del request (lo pone JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verificar si el rol del usuario está en los requeridos
    const hasRole = requiredRoles.includes(user?.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}