# Módulo de Autenticación y Autorización (Auth)

Este módulo gestiona la autenticación de usuarios mediante JSON Web Tokens (JWT) y la autorización basada en Roles y Permisos granulares.

---

## 🔒 Guards y Decoradores Disponibles

### 1. Guards (`src/auth/guards`)

* **`JwtAuthGuard`**: Extiende `AuthGuard('jwt')` de NestJS/Passport. Valida el token Bearer incluido en la cabecera `Authorization`. Si el token es inválido o no existe, retorna una respuesta `401 Unauthorized`.
* **`RolesGuard`**: Implementa `CanActivate`. Lee la metadata de roles requeridos (`ROLES_KEY`) mediante `Reflector` y verifica si el usuario autenticado posee al menos uno de los roles solicitados (`user.roles` / `user.rol`). Retorna `403 Forbidden` si no cuenta con el rol.
* **`PermissionsGuard`**: Implementa `CanActivate`. Lee la metadata de permisos requeridos (`PERMISSIONS_KEY`) mediante `Reflector` y verifica si el usuario autenticado posee todos los permisos indicados (`user.permissions`). Retorna `403 Forbidden` si falta algún permiso.

### 2. Decoradores (`src/auth/decorators`)

* **`@Roles(...roles: string[])`**: Adjunta metadata de roles a una ruta o controlador utilizando `SetMetadata(ROLES_KEY, roles)`.
* **`@Permissions(...permissions: string[])`**: Adjunta metadata de permisos granulares a una ruta o controlador utilizando `SetMetadata(PERMISSIONS_KEY, permissions)`.

---

## 🚦 Orden Estricto de Ejecución de Guards

NestJS evalúa los guards definidos en `@UseGuards(...)` de **izquierda a derecha**. 

El orden **obligatorio** de combinación en los controladores es:

$$\text{JwtAuthGuard} \longrightarrow \text{RolesGuard} \longrightarrow \text{PermissionsGuard}$$

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
```

### ¿Por qué este orden es crítico?
1. **`JwtAuthGuard` (Primero):** Autentica la solicitud y adjunta el objeto `user` a `request.user`.
2. **`RolesGuard` (Segundo):** Requiere que `request.user` ya exista para validar su rol. Si no está autenticado, fallaría previamente en el paso 1.
3. **`PermissionsGuard` (Tercero):** Valida los permisos finos del objeto `request.user`. Se ejecuta únicamente tras haber validado la autenticación y el rol general.

---

## 💻 Ejemplo de Combinación en un Controlador

```typescript
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from './guards';
import { Roles, Permissions } from './decorators';

@Controller('admin/products')
export class AdminProductsController {

  // Ruta 1: Solo requiere autenticación JWT
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return 'Listado de productos para cualquier usuario autenticado';
  }

  // Ruta 2: Requiere autenticación + Rol de 'admin' o 'manager'
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  create() {
    return 'Producto creado exitosamente';
  }

  // Ruta 3: Requiere autenticación + Rol 'admin' + Permiso granular 'delete'
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin')
  @Permissions('delete')
  remove() {
    return 'Producto eliminado por un administrador con permiso explícito de eliminación';
  }
}
```
