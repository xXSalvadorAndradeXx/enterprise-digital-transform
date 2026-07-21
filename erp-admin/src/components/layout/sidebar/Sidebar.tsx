"use client";

import { usePathname } from "next/navigation";

import Logo from "../Logo";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-items";

/**
 * Componente Sidebar.
 *
 * Responsabilidades:
 * - Mostrar el logotipo de la aplicación.
 * - Mostrar el menú de navegación principal del ERP.
 * - Determinar qué opción del menú se encuentra activa según la ruta actual.
 *
 * Nota:
 * Este componente únicamente construye la interfaz visual.
 * La lógica de permisos o carga dinámica del menú se implementará
 * posteriormente mediante integración con el backend.
 */
export default function Sidebar() {

/**
 * Obtiene la ruta actual de la aplicación.
 *
 * Ejemplo:
 * /dashboard
 * /productos
 * /equipo
 */
const pathname = usePathname();

return (

/*
* Contenedor principal del Sidebar.
*
* h-screen      → ocupa toda la altura de la ventana.
* w-64          → ancho fijo de 256px.
* flex-col      → organiza el contenido verticalmente.
* bg-white      → fondo blanco.
* px-6 py-8     → espaciado interno.
*/
<aside className="ml-[55px] flex h-screen w-64 flex-col bg-white py-8">

{/* Logo del sistema */}
<Logo />

{/* Menú principal */}
<nav className="mt-10 flex flex-col gap-[5px]">

{sidebarItems.map((item) => (

/*
* Se crea un SidebarItem por cada opción
* definida en sidebar-items.ts.
*/
<SidebarItem
key={item.id}
{...item}

/*
* Si la ruta actual coincide con la ruta del menú,
* el componente cambia automáticamente al estado Activo.
*/
active={pathname === item.href}
/>

))}

</nav>

</aside>
);
}