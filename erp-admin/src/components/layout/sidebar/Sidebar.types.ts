import type { LucideIcon } from "lucide-react";

import type { PermissionCode } from "@/types/auth/permissions.types";

/**
 * Configuración completa de una opción del Sidebar.
 * Incluye el permiso utilizado para filtrar.
 */
export interface SidebarItemType {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionCode;
}

/**
 * Propiedades del componente visual SidebarItem.
 * No incluye permission porque el filtrado ocurre en Sidebar.
 */
export interface SidebarItemProps
  extends Omit<SidebarItemType, "permission"> {
  active: boolean;
}