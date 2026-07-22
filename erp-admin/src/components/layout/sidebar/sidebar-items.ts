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
  ScanSearch,
} from "lucide-react";

export const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "productos",
    label: "Productos",
    href: "/productos",
    icon: Package,
  },
  {
    id: "pedidos",
    label: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
  },
  {
    id: "punto-venta",
    label: "Punto de venta",
    href: "/punto-venta",
    icon: Store,
  },
  {
    id: "inventario",
    label: "Inventario",
    href: "/inventario",
    icon: Boxes,
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    id: "equipo",
    label: "Equipo",
    href: "/equipo",
    icon: Handshake,
  },
  {
    id: "proveedores",
    label: "Proveedores",
    href: "/proveedores",
    icon: Truck,
  },
  {
    id: "compras",
    label: "Compras",
    href: "/compras",
    icon: CirclePlus,
  },
  {
    id: "contenido",
    label: "Contenido",
    href: "/contenido",
    icon: ScanSearch,
  },
];