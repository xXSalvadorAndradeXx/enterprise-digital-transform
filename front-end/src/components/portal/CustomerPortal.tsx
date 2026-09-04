"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_CHANGED_EVENT, hasActiveSession } from "@/lib/auth-session";
import { PortalNavigation } from "./PortalNavigation";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, listener);
  };
}

export function CustomerPortal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const authenticated = useSyncExternalStore(subscribe, hasActiveSession, () => null);

  useEffect(() => {
    if (authenticated === false) router.replace("/login");
  }, [authenticated, router]);

  if (!authenticated) {
    return <p role="status" className="px-6 py-12 text-center text-[#4A4A4A]">Comprobando sesión...</p>;
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:py-14">
      <PortalNavigation />
      <div className="min-w-0 text-[#4A4A4A]">{children}</div>
    </div>
  );
}
