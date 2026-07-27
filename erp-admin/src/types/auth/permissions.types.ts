

export type PermissionCode =
  | "dashboard:read"
  | "products:read"
  | "orders:read"
  | "pos:access"
  | "inventory:read"
  | "customers:read"
  | "users:read"
  | "suppliers:read"
  | "purchases:read"
  | "content:read";

export interface UserPermissions {
  permissions: PermissionCode[];
}