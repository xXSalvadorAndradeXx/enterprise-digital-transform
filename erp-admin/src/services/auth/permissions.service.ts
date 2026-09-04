import type {
  PermissionCode,
  UserPermissions,
} from "@/types/auth/permissions.types";

const PORTAL_PERMISSION_CODES: PermissionCode[] = [
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

const KNOWN_PERMISSION_CODES =
  new Set<PermissionCode>([
    ...PORTAL_PERMISSION_CODES,
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
 * Solo se utilizan permisos verificados por backend, nunca inferidos del rol.
 */
export async function getUserPermissions(
  _role: string,
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

  return {
    permissions: [],
  };
}
