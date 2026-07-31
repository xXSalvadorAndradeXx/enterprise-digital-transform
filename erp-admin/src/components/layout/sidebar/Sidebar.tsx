"use client";

import { usePathname } from "next/navigation";

import type { PermissionCode } from "@/types/auth/permissions.types";

import Logo from "../Logo";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-items";

interface SidebarProps {
  permissions: PermissionCode[];
}

export default function Sidebar({
  permissions,
}: SidebarProps) {
  const pathname = usePathname();

  const permissionSet = new Set(permissions);

  /*
   * Las opciones sin permiso se eliminan completamente.
   * No se renderizan deshabilitadas.
   */
  const authorizedItems = sidebarItems.filter((item) =>
    permissionSet.has(item.permission),
  );

  return (
    <aside className="ml-[55px] flex h-screen w-64 flex-col bg-white py-8">
      <Logo />

      <nav
        className="mt-10 flex flex-col gap-[5px]"
        aria-label="Navegación principal"
      >
        {authorizedItems.map((item) => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)
            }
          />
        ))}
      </nav>
    </aside>
  );
}