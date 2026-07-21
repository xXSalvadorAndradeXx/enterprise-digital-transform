import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Representa un elemento individual del Breadcrumb.
 */
interface BreadcrumbItem {
/**
 * Texto que se mostrará al usuario.
 */
label: string;

/**
 * Ruta de navegación.
 * Si existe, el elemento será un enlace (<Link>).
 * Si no existe, se interpreta como la página actual.
 */
href?: string;
}

/**
 * Propiedades del componente Breadcrumb.
 */
interface BreadcrumbProps {
/**
 * Lista de elementos que conforman la ruta de navegación.
 *
 * Ejemplo:
 * [
 *   { label: "Admin", href: "/dashboard" },
 *   { label: "Equipo" }
 * ]
 */
items: BreadcrumbItem[];
}

/**
 * Componente reutilizable que muestra la ubicación actual
 * del usuario dentro de la aplicación.
 *
 * Ejemplo visual:
 *
 * Admin > Equipo
 *
 * Características:
 * - Los elementos con "href" se muestran como enlaces.
 * - El último elemento representa la página actual.
 * - Se agrega automáticamente el separador (>) entre elementos.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
return (
<nav
className="flex items-center text-sm"
aria-label="Breadcrumb"
>
{items.map((item, index) => (
<div
key={item.label}
className="flex items-center"
>
{/* Si existe una ruta, mostrar un enlace */}
{item.href ? (
<Link
href={item.href}
className="text-gray-500 transition-colors hover:text-black"
>
{item.label}
</Link>
) : (
/* Si no existe una ruta, es la página actual */
<span className="font-medium text-black">
{item.label}
</span>
)}

{/* Mostrar el separador únicamente entre elementos */}
{index < items.length - 1 && (
<ChevronRight
size={16}
className="mx-2 text-gray-400"
/>
)}
</div>
))}
</nav>
);
}