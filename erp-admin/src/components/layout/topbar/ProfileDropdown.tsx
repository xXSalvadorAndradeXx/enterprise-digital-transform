import { ChevronDown, User } from "lucide-react";

interface ProfileDropdownProps {
/**
 * Nombre del usuario que se mostrará en el Topbar.
 */
name: string;
}

/**
 * Componente que muestra el usuario autenticado.
 *
 * Diseño basado en Figma:
 * - Ícono de usuario dentro de un círculo.
 * - Nombre del usuario.
 * - Flecha que indica la existencia de un menú desplegable.
 *
 * Nota:
 * Este componente representa únicamente la interfaz visual.
 * La lógica para desplegar el menú se implementará posteriormente.
 */
export default function ProfileDropdown({
name,
}: ProfileDropdownProps) {
return (
<button className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100">

{/* Contenedor circular del ícono */}
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CFE2FF]">
<User
    size={22}
    className="text-black"
    strokeWidth={2}
/>
</div>

{/* Nombre del usuario */}
<span className="text-base font-semibold text-[#000000]">
{name}
</span>

{/* Indicador de menú desplegable */}
<ChevronDown
size={20}
className="text-black"
strokeWidth={2.5}
/>
</button>
);
}