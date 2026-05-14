import { SetMetadata } from '@nestjs/common';

// Clave con la que se guardará la metadata
export const ROLES_KEY = 'roles';

// Decorador @Roles('admin') que se usa en los controllers
// SetMetadata guarda los roles en los metadatos del método
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);