import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para roles requeridos.
 * Leída por RolesGuard mediante Reflector.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para declarar los roles requeridos en un endpoint.
 * TDD § 2.5 — Usado junto con RolesGuard.
 *
 * Uso: @Roles('SUPERADMIN')
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);