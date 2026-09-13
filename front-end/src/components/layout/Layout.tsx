"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import {
  AUTH_SESSION_CHANGED_EVENT,
  readAuthSessionIdentity,
} from "@/lib/auth-session";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

type LayoutProps = {
  children: ReactNode;
};

const authenticationRoutes = ["/login", "/registro"] as const;

function isAuthenticationRoute(pathname: string) {
  return authenticationRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function subscribeToAuthSession(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, listener);
  };
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const usesAuthenticationLayout = isAuthenticationRoute(pathname);
  const sessionIdentity = useSyncExternalStore(
    subscribeToAuthSession,
    readAuthSessionIdentity,
    () => null,
  );

  return (
    <CartProvider key={sessionIdentity ?? "anonymous"}>
      <div className="flex min-h-screen flex-col bg-white">
        {usesAuthenticationLayout ? null : <Header />}

        <main className="flex-1">
          {children}
        </main>

        {usesAuthenticationLayout ? null : <Footer />}
      </div>
    </CartProvider>
  );
}
