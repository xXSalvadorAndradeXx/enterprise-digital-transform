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

const KNOWN_PERMISSION_CODES =
  new Set<PermissionCode>([
    ...ADMIN_PERMISSIONS,
  ]);

function isPermissionCode(
  value: string,
): value is PermissionCode {
  return KNOWN_PERMISSION_CODES.has(
    value as PermissionCode,
  );
}

function normalizePermissionCodes(
  permissions: readonly string[],
): PermissionCode[] {
  return Array.from(
    new Set(
      permissions.filter(
        isPermissionCode,
      ),
    ),
  );
}

/**
 * Obtiene los permisos efectivos del usuario.
 *
 * Si la sesion ya contiene permisos reales del Backend, se usan esos permisos.
 * El fallback por rol se mantiene para sesiones publicas creadas antes de que
 * el perfil del Backend devuelva permissions.
 */
export async function getUserPermissions(
  role: string,
  grantedPermissions?: readonly string[],
): Promise<UserPermissions> {
  if (grantedPermissions) {
    return {
      permissions:
        normalizePermissionCodes(
          grantedPermissions,
        ),
    };
  }

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

  return {
    permissions: [],
  };
}
