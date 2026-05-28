"use client";

import {
  AUTH_SESSION_CHANGED_EVENT,
  hasActiveSession,
} from "@/lib/auth-session";
import { useCart } from "@/hooks/useCart";
import { Home, LogIn, Package, ShoppingCart, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinkBaseClassName =
  "inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 sm:px-4";

const primaryNavLinkBaseClassName =
  "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all duration-300 sm:px-5";

const cartLinkBaseClassName =
  "inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-md transition-all duration-300";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCartTotal(totalPrice: number) {
  return priceFormatter.format(Number.isFinite(totalPrice) ? totalPrice : 0);
}

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

function getCartLinkClassName(pathname: string) {
  const isActive = isActivePath(pathname, "/carrito");

  return `${cartLinkBaseClassName} ${
    isActive
      ? "border-[#003791] bg-[#003791] text-white ring-2 ring-[#EAF3FF]"
      : "border-[#D9E2EC] bg-[#111111] text-white hover:-translate-y-0.5 hover:border-[#005BFF] hover:bg-[#003791] hover:shadow-lg"
  }`;
}

export default function Header() {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();
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
  const AccountIcon = isAuthenticated ? User : LogIn;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D9E2EC] bg-white/95 shadow-[0_12px_35px_rgba(0,55,145,0.08)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003791] text-lg font-bold text-white shadow-md shadow-[#003791]/20">
            E
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl">
              E-<span className="text-[#005BFF]">Commerce</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Tienda virtual
            </p>
          </div>
        </Link>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className={getNavLinkClassName(pathname, "/")}>
              <Home className="h-4 w-4" aria-hidden="true" />
              Inicio
            </Link>

            <Link
              href="/productos"
              className={getNavLinkClassName(pathname, "/productos")}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Productos
            </Link>
          </div>

          <span
            className="hidden h-8 w-px bg-[#D9E2EC] md:block"
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={accountHref}
              className={getNavLinkClassName(pathname, accountHref)}
            >
              <AccountIcon className="h-4 w-4" aria-hidden="true" />
              {accountLabel}
            </Link>

            {isAuthenticated ? null : (
              <Link
                href="/registro"
                className={getPrimaryNavLinkClassName(pathname, "/registro")}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Registro
              </Link>
            )}
          </div>

          <span
            className="hidden h-8 w-px bg-[#D9E2EC] md:block"
            aria-hidden="true"
          />

          <Link href="/carrito" className={getCartLinkClassName(pathname)}>
            <span className="relative inline-flex">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {totalItems > 0 ? (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#005BFF] px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">
                  {totalItems}
                </span>
              ) : null}
            </span>
            <span className="flex flex-col items-start leading-none">
              <span>Carrito</span>
              {totalItems > 0 ? (
                <span className="mt-1 hidden text-[11px] font-semibold text-white/75 lg:block">
                  {formatCartTotal(totalPrice)}
                </span>
              ) : null}
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}


