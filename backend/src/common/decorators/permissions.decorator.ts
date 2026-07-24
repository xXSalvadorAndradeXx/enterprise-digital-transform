import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para permisos atómicos.
 * Leída por PermissionsGuard mediante Reflector.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para declarar los permisos requeridos en un endpoint.
 * TDD § 2.5 y § 9.2 — Convención recurso:accion (ej. products:create).
 *
 * Uso: @Permissions('products:create')
 *      @Permissions('purchases:read', 'purchases:approve')
 */
export const Permissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);