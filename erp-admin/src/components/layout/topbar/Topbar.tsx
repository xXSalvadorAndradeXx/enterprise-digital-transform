import { Menu } from "lucide-react";

import Breadcrumb from "./Breadcrumb";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";

interface TopbarProps {
  /**
   * Nombre del usuario obtenido por el Layout.
   */
  userName: string;

  onMenuClick: () => void;
}

export default function Topbar({
  userName,
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:h-20 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          aria-controls="erp-sidebar"
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
        >
          <Menu
            size={24}
            aria-hidden="true"
          />
        </button>

        <div className="hidden min-w-0 sm:block">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <NotificationBell count={1} />

        {/* Ya no mostramos "Admin" de forma fija. */}
        <ProfileDropdown name={userName} />
      </div>
    </header>
  );
}
