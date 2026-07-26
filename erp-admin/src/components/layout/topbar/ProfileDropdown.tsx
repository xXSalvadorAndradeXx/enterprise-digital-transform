"use client";

import {
ChevronDown,
LoaderCircle,
LogOut,
User,
} from "lucide-react";
import {
usePathname,
useRouter,
} from "next/navigation";
import {
useEffect,
useRef,
useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";

interface ProfileDropdownProps {
/**
 * Nombre del usuario autenticado que se muestra
 * en el bloque del perfil.
 */
name: string;
}

export default function ProfileDropdown({
name,
}: ProfileDropdownProps) {
// Controla si el menú está abierto.
const [isOpen, setIsOpen] = useState(false);

// Controla el estado visual durante el cierre de sesión.
const [isLoggingOut, setIsLoggingOut] =
useState(false);

// Referencia utilizada para detectar clics fuera del menú.
const containerRef = useRef<HTMLDivElement>(null);

const pathname = usePathname();
const router = useRouter();

/**
 * clearSession pertenece al AuthContext.
 *
 * Esta función hace DELETE /api/auth/session,
 * elimina la cookie y limpia el usuario del estado global.
 */
const { clearSession } = useAuth();

/**
 * Cierra automáticamente el Dropdown cuando cambia
 * la ruta actual.
 */
useEffect(() => {
setIsOpen(false);
}, [pathname]);

/**
 * Mientras el menú esté abierto:
 *
 * - Cierra al hacer clic fuera.
 * - Cierra al presionar Escape.
 */
useEffect(() => {
if (!isOpen) {
return;
}

const handlePointerDown = (
event: PointerEvent,
) => {
const target = event.target;

if (
target instanceof Node &&
!containerRef.current?.contains(target)
) {
setIsOpen(false);
}
};

const handleKeyDown = (
event: KeyboardEvent,
) => {
if (event.key === "Escape") {
setIsOpen(false);
}
};

document.addEventListener(
"pointerdown",
handlePointerDown,
);

document.addEventListener(
"keydown",
handleKeyDown,
);

return () => {
document.removeEventListener(
"pointerdown",
handlePointerDown,
);

document.removeEventListener(
"keydown",
handleKeyDown,
);
};
}, [isOpen]);

/**
 * Finaliza la sesión actual.
 *
 * Flujo:
 * 1. Deshabilita el botón.
 * 2. Elimina la sesión mediante AuthContext.
 * 3. Redirige al login.
 * 4. Refresca los Server Components.
 */
const handleLogout = async (): Promise<void> => {
if (isLoggingOut) {
return;
}

setIsLoggingOut(true);
setIsOpen(false);

try {
await clearSession();

/**
 * replace evita que el usuario vuelva al ERP
 * presionando el botón "Atrás".
 */
router.replace("/login");

/**
 * Fuerza a los Server Components a comprobar
 * nuevamente la cookie de sesión.
 */
router.refresh();
} finally {
setIsLoggingOut(false);
}
};

return (
<div
ref={containerRef}
className="relative"
>
<button
type="button"
onClick={() =>
setIsOpen((current) => !current)
}
disabled={isLoggingOut}
className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
aria-haspopup="menu"
aria-expanded={isOpen}
aria-controls="profile-menu"
>
<span className="flex size-10 items-center justify-center rounded-full bg-[#CFE2FF]">
<User
size={22}
className="text-black"
strokeWidth={2}
aria-hidden="true"
/>
</span>

<span className="text-base font-semibold text-black">
{name}
</span>

<ChevronDown
size={20}
strokeWidth={2.5}
aria-hidden="true"
className={[
"text-black transition-transform duration-200",
isOpen ? "rotate-180" : "",
].join(" ")}
/>
</button>

{isOpen && (
<div
id="profile-menu"
role="menu"
className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
>
<button
type="button"
role="menuitem"
onClick={() => {
void handleLogout();
}}
disabled={isLoggingOut}
className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
>
{isLoggingOut ? (
<LoaderCircle
size={18}
className="animate-spin"
aria-hidden="true"
/>
) : (
<LogOut
size={18}
aria-hidden="true"
/>
)}

<span>
{isLoggingOut
? "Cerrando sesión..."
: "Cerrar sesión"}
</span>
</button>
</div>
)}
</div>
);
}