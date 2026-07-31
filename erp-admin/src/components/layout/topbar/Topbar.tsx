import Breadcrumb from "./Breadcrumb";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";

interface TopbarProps {
  /**
   * Nombre del usuario obtenido por el Layout.
   */
  userName: string;
}

export default function Topbar({
  userName,
}: TopbarProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white bg-white px-8">
      <Breadcrumb />

      <div className="flex items-center gap-6">
        <NotificationBell count={1} />

        {/* Ya no mostramos "Admin" de forma fija. */}
        <ProfileDropdown name={userName} />
      </div>
    </header>
  );
}