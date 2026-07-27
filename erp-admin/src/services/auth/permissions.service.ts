import type {
PermissionCode,
UserPermissions,
} from "@/types/auth/permissions.types";

const ADMIN_PERMISSIONS: PermissionCode[] = [
"dashboard:read",
"products:read",
"orders:read",
"pos:access",
"inventory:read",
"customers:read",
"users:read",
"suppliers:read",
"purchases:read",
"content:read",
];

const EMPLOYEE_PERMISSIONS: PermissionCode[] = [
"orders:read",
"pos:access",
"inventory:read",
"customers:read",
];

/**
 * Obtiene los permisos efectivos del usuario.
 *
 * IMPLEMENTACIÓN TEMPORAL:
 * Backend todavía no devuelve correctamente los permisos desde auth/me.
 * Por ahora, los permisos se calculan usando el rol de la sesión.
 *
 * MIGRACIÓN FUTURA:
 * Cuando backend complete GET /auth/me o GET /auth/permissions,
 * solamente se reemplazará el contenido de esta función por un fetch.
 */
export async function getUserPermissions(
role: string,
): Promise<UserPermissions> {
const normalizedRole = role.trim().toUpperCase();

if (
normalizedRole === "ADMIN" ||
normalizedRole === "SUPERADMIN"
) {
return {
    permissions: ADMIN_PERMISSIONS,
};
}

if (normalizedRole === "EMPLEADO") {
return {
    permissions: EMPLOYEE_PERMISSIONS,
};
}

/*
* Comportamiento seguro:
* un rol desconocido no recibe acceso a ningún módulo.
*/
return {
permissions: [],
};
}