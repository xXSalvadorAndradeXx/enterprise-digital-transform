"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Heart, LogOut, ShoppingCart, Truck, UserRound } from "lucide-react";

const links = [
  { href: "/cuenta", label: "Cuenta", icon: UserRound },
  { href: "/cuenta/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: Truck },
  { href: "/cuenta/notificaciones", label: "Notificaciones", icon: Bell },
];

// Frontend 1 conectará aquí el cierre de sesión completo.
type Props = { onLogout?: () => void };

export function PortalNavigation({ onLogout }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/cuenta"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  const activeLabel = links.find(({ href }) => isActive(href))?.label ?? "Mi cuenta";

  const navigation = (
    <nav aria-label="Portal del cliente" className="space-y-2 text-sm text-[#4A4A4A]">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-md border-l-[5px] px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isActive(href) ? "border-[#9BC1FF] bg-[#F2F4FD] font-medium text-black" : "border-transparent hover:bg-[#F2F4FD]"}`}>
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />{label}
        </Link>
      ))}
      <button type="button" onClick={onLogout} disabled={!onLogout}
        title={!onLogout ? "Cierre de sesión pendiente de integración" : undefined}
        className="flex min-h-11 w-full items-center gap-3 rounded-md border-l-[5px] border-transparent px-4 py-3 text-left hover:bg-[#F2F4FD] focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:text-gray-400">
        <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />Cerrar sesión
      </button>
    </nav>
  );

  return (
    <aside className="self-start lg:sticky lg:top-36 lg:pt-10">
      <div className="hidden lg:block">{navigation}</div>
      <details key={pathname} className="rounded-lg border border-[#E1E5ED] bg-white lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-[#4A4A4A]">
          Mi cuenta · {activeLabel}<ChevronDown className="h-4 w-4" aria-hidden="true" />
        </summary>
        <div className="border-t border-[#E1E5ED] p-2">{navigation}</div>
      </details>
    </aside>
  );
}
