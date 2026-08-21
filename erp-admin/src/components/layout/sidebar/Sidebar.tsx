"use client";

import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import type { PermissionCode } from "@/types/auth/permissions.types";

import Logo from "../Logo";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-items";

interface SidebarProps {
  permissions: PermissionCode[];
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  permissions,
  isOpen,
  onClose,
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
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        id="erp-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,85vw)] shrink-0 flex-col overflow-y-auto bg-white px-5 py-6 shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:ml-[55px] lg:h-screen lg:w-64 lg:translate-x-0 lg:px-0 lg:py-8 lg:shadow-none ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <X
              size={24}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav
          className="mt-10 flex flex-col gap-[5px]"
          aria-label="Navegación principal"
          onClick={onClose}
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
    </>
  );
}
