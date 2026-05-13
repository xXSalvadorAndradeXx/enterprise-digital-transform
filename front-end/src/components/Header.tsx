"use client";

import {
  AUTH_SESSION_CHANGED_EVENT,
  hasActiveSession,
} from "@/lib/auth-session";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinkBaseClassName =
  "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300";

const primaryNavLinkBaseClassName =
  "rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all duration-300";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavLinkClassName(pathname: string, href: string) {
  const isActive = isActivePath(pathname, href);

  return `${navLinkBaseClassName} ${
    isActive
      ? "border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791] shadow-sm"
      : "text-[#111111] hover:bg-[#EAF3FF] hover:text-[#003791]"
  }`;
}

function getPrimaryNavLinkClassName(pathname: string, href: string) {
  const isActive = isActivePath(pathname, href);

  return `${primaryNavLinkBaseClassName} ${
    isActive
      ? "bg-[#003791] text-white ring-2 ring-[#EAF3FF]"
      : "bg-[#005BFF] text-white hover:-translate-y-0.5 hover:bg-[#003791] hover:shadow-lg"
  }`;
}

export default function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      setIsAuthenticated(hasActiveSession());
    };

    updateAuthState();
    window.addEventListener("storage", updateAuthState);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, updateAuthState);

    return () => {
      window.removeEventListener("storage", updateAuthState);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, updateAuthState);
    };
  }, [pathname]);

  const accountHref = isAuthenticated ? "/cuenta" : "/login";
  const accountLabel = isAuthenticated ? "Mi cuenta" : "Login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D9E2EC] bg-white/95 shadow-[0_12px_35px_rgba(0,55,145,0.08)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003791] text-lg font-bold text-white shadow-md shadow-[#003791]/20">
            E
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
              E-<span className="text-[#005BFF]">Commerce</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Tienda virtual
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 md:justify-end md:gap-3">
          <Link href="/" className={getNavLinkClassName(pathname, "/")}>
            Inicio
          </Link>

          <Link
            href="/productos"
            className={getNavLinkClassName(pathname, "/productos")}
          >
            Productos
          </Link>

          <Link
            href={accountHref}
            className={getNavLinkClassName(pathname, accountHref)}
          >
            {accountLabel}
          </Link>

          {isAuthenticated ? null : (
            <Link
              href="/registro"
              className={getPrimaryNavLinkClassName(pathname, "/registro")}
            >
              Registro
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
