"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
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

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const usesAuthenticationLayout = isAuthenticationRoute(pathname);

  return (
    <CartProvider>
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
