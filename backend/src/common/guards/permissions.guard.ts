// src/common/guards/permissions.guard.ts
import {
  Injectable, CanActivate,
  ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si el endpoint no declara permisos requeridos, pasa
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasAll = required.every((p) => user?.permissions?.includes(p));

    if (!hasAll) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}