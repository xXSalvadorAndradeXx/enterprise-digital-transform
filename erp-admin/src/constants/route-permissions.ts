import type { PermissionCode } from "@/types/auth/permissions.types";

export const ROUTE_PERMISSIONS: Record<
  string,
  PermissionCode
> = {
  "/dashboard": "dashboard:read",
  "/productos": "products:read",
  "/pedidos": "orders:read",
  "/punto-venta": "pos:access",
  "/inventario": "inventory:read",
  "/clientes": "customers:read",
  "/equipo": "users:read",
  "/proveedores": "suppliers:read",
  "/compras": "purchases:read",
  "/contenido": "content:read",
};

export function getFirstAllowedRoute(permissions: readonly string[] = []): string | null {
  return Object.entries(ROUTE_PERMISSIONS).find(([, permission]) =>
    permissions.includes(permission),
  )?.[0] ?? null;
}
