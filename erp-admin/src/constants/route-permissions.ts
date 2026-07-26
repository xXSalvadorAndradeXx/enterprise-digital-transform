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