import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Boxes,
  Users,
  Handshake,
  Truck,
  CirclePlus,
  List,
} from "lucide-react";

import type { SidebarItemType } from "./Sidebar.types";

export const sidebarItems: SidebarItemType[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:read",
  },
  {
    id: "productos",
    label: "Productos",
    href: "/productos",
    icon: Package,
    permission: "products:read",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    permission: "orders:read",
  },
  {
    id: "punto-venta",
    label: "Punto de venta",
    href: "/punto-venta",
    icon: Store,
    permission: "pos:access",
  },
  {
    id: "inventario",
    label: "Inventario",
    href: "/inventario",
    icon: Boxes,
    permission: "inventory:read",
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    permission: "customers:read",
  },
  {
    id: "equipo",
    label: "Equipo",
    href: "/equipo",
    icon: Handshake,
    permission: "users:read",
  },
  {
    id: "Provedor",
    label: "Provedores",
    href: "/Provedor",
    icon: Truck,
    permission: "suppliers:read",
  },
  {
    id: "compras",
    label: "Compras",
    href: "/compras",
    icon: CirclePlus,
    permission: "purchases:read",
  },
  {
    id: "contenido",
    label: "Contenido",
    href: "/contenido",
    icon: List,
    permission: "content:read",
  },
];