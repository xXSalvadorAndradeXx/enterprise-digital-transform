import Breadcrumb from "./Breadcrumb";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumb: BreadcrumbItem[];
}

/**
 * Componente Topbar.
 *
 * Muestra la navegación superior del ERP.
 * Está compuesto por:
 * - Breadcrumb (lado izquierdo).
 * - Campana de notificaciones.
 * - Información del usuario autenticado.
 */
export default function Topbar({ breadcrumb }: TopbarProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-[#FFFFFF] bg-[#FFFFFF] px-8">

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumb} />

      {/* Acciones del usuario */}
      <div className="flex items-center gap-6">

        {/* Notificaciones */}
        <NotificationBell count={1} />

        {/* Usuario */}
        <ProfileDropdown
          name="Admin"
        />

      </div>

    </header>
  );
}