"use client";

import Link from "next/link";
import { SidebarItemType } from "./Sidebar.types";

/**
 * Propiedades del componente SidebarItem.
 *
 * Extiende la interfaz SidebarItemType agregando
 * la propiedad "active", la cual permite conocer
 * si el elemento del menú corresponde a la ruta actual.
 */
interface Props extends SidebarItemType {

/**
 * Estado visual del elemento.
 *
 * true  → Estado Activo.
 * false → Estado Normal.
 *
 * Valor por defecto: false.
 */
active?: boolean;
}

/**
 * Componente reutilizable que representa una opción
 * del menú de navegación del Sidebar.
 *
 * Responsabilidades:
 * - Mostrar el ícono del módulo.
 * - Mostrar el nombre del módulo.
 * - Navegar hacia la ruta correspondiente.
 * - Mostrar el estado Activo o Normal.
 *
 * Nota:
 * Este componente únicamente construye la interfaz visual.
 * La lógica de permisos o navegación dinámica se implementará
 * posteriormente mediante integración con el backend.
 */
export default function SidebarItem({
label,
href,
icon: Icon,
active = false,
}: Props) {

return (

/*
* Link de Next.js.
*
* Permite navegar entre páginas del ERP
* sin recargar completamente la aplicación.
*/
<Link
href={href}
className={`
/* Distribución */
flex items-center gap-3

/* Espaciado interno */
px-4 py-3

/* Bordes */
rounded-lg

/* Animación */
transition-colors duration-200

${
/*
* Estado Activo
*
* Se aplica cuando la ruta actual
* coincide con el enlace del menú.
*/
active
? "bg-[#CFE2FF] text-[#4A4A4A]"

/*
* Estado Normal
*
* Se aplica a los elementos que
* no se encuentran seleccionados.
*/
: "text-[#4A4A4A] hover:bg-gray-100"
}
`}
>

{/* Ícono del módulo */}
<Icon size={18} />

{/*
* Nombre del módulo.
*
* Se utiliza la clase "body" definida
* en globals.css.
*
* Tipografía:
* - Fuente: Poppins
* - Tamaño: 16px
* - Peso: Bold
*/}
<span className="sidebar-text">
{label}
</span>

</Link>
);
}