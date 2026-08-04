"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import Sidebar from "@/components/layout/sidebar/Sidebar";
import Topbar from "@/components/layout/topbar/Topbar";
import { ROUTE_PERMISSIONS } from "@/constants/route-permissions";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/services/auth/permissions.service";
import type { PermissionCode } from "@/types/auth/permissions.types";

interface ERPLayoutProps {
  children: ReactNode;
}

export default function ERPLayout({
  children,
}: ERPLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

const {
  user,
  isAuthenticated,
  isInitializing,
  mustChangePassword,
  clearSession,
} = useAuth();


  const [permissions, setPermissions] = useState<
    PermissionCode[]
  >([]);

  const [isLoadingPermissions, setIsLoadingPermissions] =
    useState(true);

    const [permissionsError, setPermissionsError] =
  useState<string | null>(null);

  /**
   * Busca el permiso requerido para la ruta actual.
   *
   * También reconoce rutas secundarias como:
   * /inventario/crear
   * /productos/123
   */
  const currentRouteEntry = Object.entries(
    ROUTE_PERMISSIONS,
  ).find(
    ([route]) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  const requiredPermission =
    currentRouteEntry?.[1];

  const hasRoutePermission =
    !requiredPermission ||
    permissions.includes(requiredPermission);

  /**
   * Protege todas las rutas del grupo ERP.
   */
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (mustChangePassword) {
      router.replace("/cambiar-password");
    }
  }, [
    isAuthenticated,
    isInitializing,
    mustChangePassword,
    router,
    user,
  ]);

  /**
   * Obtiene los permisos después de recuperar la sesión
   * y antes de mostrar el Sidebar.
   */
  useEffect(() => {
    if (
      isInitializing ||
      !isAuthenticated ||
      !user ||
      mustChangePassword
    ) {
      return;
    }

    let isCancelled = false;

const loadPermissions = async (): Promise<void> => {
  setIsLoadingPermissions(true);
  setPermissionsError(null);

  try {
    const result = await getUserPermissions(user.rol);

    if (isCancelled) {
      return;
    }

    /*
     * Respuesta vacía:
     * no se concede ningún permiso por defecto.
     */
    if (
      !Array.isArray(result.permissions) ||
      result.permissions.length === 0
    ) {
      setPermissions([]);
      setPermissionsError(
        "No tienes permisos asignados para acceder al ERP.",
      );

      return;
    }

    setPermissions(result.permissions);
  } catch {
    if (!isCancelled) {
      /*
       * Error de red, servidor o respuesta inválida.
       * Se aplica fail closed: ningún permiso.
       */
      setPermissions([]);
      setPermissionsError(
        "No fue posible verificar tus permisos. Intenta nuevamente.",
      );
    }
  } finally {
    if (!isCancelled) {
      setIsLoadingPermissions(false);
    }
  }
};

    void loadPermissions();

    return () => {
      isCancelled = true;
    };
  }, [
    isAuthenticated,
    isInitializing,
    mustChangePassword,
    user,
  ]);

  /**
   * Impide acceder manualmente a una ruta sin permiso.
   *
   * Ejemplo:
   * un EMPLEADO no puede escribir /dashboard
   * directamente en el navegador.
   */
useEffect(() => {
  if (
    isInitializing ||
    isLoadingPermissions ||
    !isAuthenticated ||
    !user ||
    mustChangePassword ||
    permissionsError
  ) {
    return;
  }

  if (hasRoutePermission) {
    return;
  }

  

  const normalizedRole = user.rol
    .trim()
    .toUpperCase();

  const fallbackRoute =
    normalizedRole === "EMPLEADO"
      ? "/pedidos"
      : "/dashboard";



  router.replace(fallbackRoute);
}, [
  hasRoutePermission,
  isAuthenticated,
  isInitializing,
  isLoadingPermissions,
  mustChangePassword,
  permissionsError,
  router,
  user,
]);

  /**
   * No muestra el ERP mientras se recupera la sesión
   * o se cargan los permisos.
   */
  if (isInitializing || isLoadingPermissions) {
    return <ERPLayoutLoading />;
  }

  /**
   * No muestra contenido privado mientras se redirige
   * al usuario hacia /login.
   */
  if (!isAuthenticated || !user) {
    return <ERPLayoutLoading />;
  }

  /**
   * Impide mostrar el ERP antes de cambiar
   * la contraseña temporal.
   */
  if (mustChangePassword) {
    return <ERPLayoutLoading />;
  }

  /**
   * Evita mostrar durante un instante una página
   * para la cual el usuario no tiene permiso.
   */
  if (!hasRoutePermission) {
    return <ERPLayoutLoading />;
  }

  if (permissionsError) {
  return (
    <ERPAccessUnavailable
      message={permissionsError}
      onLogout={() => {
        void clearSession().then(() => {
          router.replace("/login");
          router.refresh();
        });
      }}
    />
  );
}

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={permissions} />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={user.nombre} />

        <section className="flex-1 p-8">
          {children}
        </section>
      </main>
    </div>
  );
}

function ERPLayoutLoading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-white"
      role="status"
      aria-label="Validando sesión"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#55B559]" />

        <p className="text-sm text-[#4A4A4A]">
          Validando sesión...
        </p>
      </div>
    </main>
  );
}

interface ERPAccessUnavailableProps {
  message: string;
  onLogout: () => void;
}

function ERPAccessUnavailable({
  message,
  onLogout,
}: ERPAccessUnavailableProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6">
      <section
        role="alert"
        className="w-full max-w-[460px] rounded-xl border border-[#E4E7EC] bg-white p-8 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-[#2F2F2F]">
          Acceso no disponible
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#4A4A4A]">
          {message}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-11 rounded-lg bg-[#55B559] px-6 font-semibold text-white hover:brightness-95"
        >
          Reintentar
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="ml-3 h-11 rounded-lg border border-[#1C21D1] px-6 font-semibold text-[#1C21D1]"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
