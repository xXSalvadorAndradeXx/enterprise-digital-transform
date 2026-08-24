"use client";

import { AUTH_SESSION_CHANGED_EVENT, hasActiveSession, readSessionUser } from "@/lib/auth-session";
import { ChevronDown, Headphones, LogIn, Menu, PackageCheck, RefreshCcw, Search, ShieldCheck, ShoppingCart, User, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { MiniCart } from "@/components/cart/MiniCart";
import { useCart } from "@/hooks/cart/useCart";


const fallbackCategories = [
  { id: 1, name: "Ropa" },
  { id: 2, name: "Calzado" },
  { id: 3, name: "Accesorios" },
];
type HeaderCategory = { id: number; name: string };

function TopBar() {
  const benefits = [[PackageCheck, "Envíos gratis en compras +$50"], [RefreshCcw, "Devoluciones hasta 30 días"], [ShieldCheck, "Pago 100% seguro"], [Headphones, "Atención personal"]] as const;
  return <div className="hidden bg-[#f2f5fb] lg:block"><div className="mx-auto grid max-w-[1440px] grid-cols-4 px-8 py-3">{benefits.map(([Icon,label]) => <div key={label} className="flex items-center justify-center gap-3 text-xs font-semibold"><Icon className="h-4 w-4" aria-hidden="true"/><span>{label}</span></div>)}</div></div>;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const accountRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [categoriesOpen,setCategoriesOpen] = useState(false);
  const [accountOpen,setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authenticated,setAuthenticated] = useState(false);
  const [userName,setUserName] = useState("Mi cuenta");
  const [search,setSearch] = useState("");
  const [categories,setCategories] = useState<HeaderCategory[]>(fallbackCategories);

  const {
    items,
    totalItems,
    subtotal,
    removeFromCart,
  } = useCart();

  useEffect(() => {
    const sync = () => { const user = readSessionUser() as Record<string, unknown> | null; setAuthenticated(hasActiveSession()); setUserName(String(user?.nombre ?? user?.name ?? user?.fullName ?? "Mi cuenta")); };
    sync(); window.addEventListener("storage",sync); window.addEventListener(AUTH_SESSION_CHANGED_EVENT,sync);
    return () => { window.removeEventListener("storage",sync); window.removeEventListener(AUTH_SESSION_CHANGED_EVENT,sync); };
  },[pathname]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("http://localhost:3000/api/v1/categories?publishedOnly=true",{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then((payload:unknown)=>{
      const raw = typeof payload === "object" && payload && "data" in payload ? (payload as {data?:unknown}).data : payload;
      if (!Array.isArray(raw)) return;
      const result = raw.flatMap((item):HeaderCategory[]=>{ if(!item||typeof item!=="object")return[]; const value=item as Record<string,unknown>; const id=Number(value.id); const name=String(value.name??value.nombre??"").trim(); return Number.isFinite(id)&&name?[{id,name}]:[]; });
      if(result.length)setCategories(result);
    }).catch(()=>undefined); return()=>controller.abort();
  },[]);

  useEffect(()=>{document.body.style.overflow=mobileOpen?"hidden":"";return()=>{document.body.style.overflow="";}},[mobileOpen]);
  useEffect(()=>{const close=(e:MouseEvent)=>{const target=e.target as Node;if(accountRef.current&&!accountRef.current.contains(target))setAccountOpen(false);if(categoriesRef.current&&!categoriesRef.current.contains(target))setCategoriesOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);

  const submitSearch=(event:FormEvent)=>{event.preventDefault();const value=search.trim();router.push(value?`/productos?search=${encodeURIComponent(value)}`:"/productos")};
  const closeCategoryMenus=()=>{setCategoriesOpen(false);setMobileOpen(false)};
  const categoryLinks = <><Link href="/productos" onClick={closeCategoryMenus} className="block rounded-md px-4 py-2 text-sm font-semibold hover:bg-[#f2f5fb]">Todos los productos</Link>{categories.map(category=><Link key={category.id} href={`/productos?categoryId=${category.id}`} onClick={closeCategoryMenus} className="block rounded-md px-4 py-2 text-sm hover:bg-[#f2f5fb]">{category.name}</Link>)}</>;

  return <header className="sticky top-0 z-50 border-b border-[#e1e5ed] bg-white">
    <TopBar/>
    <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-5 px-5 sm:px-8 lg:gap-10">
      <button className="lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu className="h-5 w-5"/></button>
      <Link href="/" className="font-serif text-3xl">Woden</Link>
      <div ref={categoriesRef} className="relative hidden lg:block"><button className="flex items-center gap-3 px-3 py-2 text-sm" onClick={()=>setCategoriesOpen(v=>!v)} aria-expanded={categoriesOpen}>Categorías <ChevronDown className="h-4 w-4"/></button>{categoriesOpen&&<div className="absolute left-0 top-12 min-w-56 rounded-lg border border-[#e1e5ed] bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">{categoryLinks}</div>}</div>
      <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-sm items-center rounded border border-[#9ca3af] px-3 focus-within:border-[#9ca3af] focus-within:ring-0 md:flex"><Search className="h-4 w-4 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} className="h-10 w-full bg-transparent px-2 text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0" placeholder="Buscar Productos" aria-label="Buscar productos"/></form>
      <button
  type="button"
  onClick={() => setCartOpen(true)}
  aria-label={`Abrir carrito. ${totalItems} productos`}
  className="relative ml-auto rounded-full p-2 transition-colors hover:bg-[#f2f5fb] md:ml-0"
>
  <ShoppingCart className="h-5 w-5" />

  {totalItems > 0 && (
    <span
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2222e7] px-1 text-[10px] font-semibold text-white"
      aria-hidden="true"
    >
      {totalItems > 99 ? "99+" : totalItems}
    </span>
  )}
</button>
      <div className="relative" ref={accountRef}><button onClick={()=>setAccountOpen(v=>!v)} className="flex items-center gap-1 rounded-full p-2 hover:bg-[#f2f5fb]" aria-label="Menú de usuario"><User className="h-5 w-5"/><ChevronDown className="h-3 w-3"/></button>{accountOpen&&<div className="absolute right-0 top-12 w-56 rounded-lg border bg-white p-2 shadow-xl">{authenticated?<><p className="px-3 py-2 text-xs text-slate-500">Sesión iniciada</p><Link href="/cuenta" className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#f2f5fb]">{userName}</Link></>:<><Link href="/login" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#f2f5fb]"><LogIn className="h-4 w-4"/>Iniciar sesión</Link><Link href="/registro" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#f2f5fb]"><UserPlus className="h-4 w-4"/>Registrarse</Link></>}</div>}</div>
    </div>
    {mobileOpen&&<div className="fixed inset-0 z-[60] bg-black/30 lg:hidden" onMouseDown={e=>e.target===e.currentTarget&&setMobileOpen(false)}><aside className="h-full w-[min(88vw,340px)] overflow-y-auto bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><span className="font-serif text-2xl">Woden</span><button onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"><X/></button></div><form onSubmit={submitSearch} className="mt-6 flex items-center rounded border px-3"><Search className="h-4 w-4"/><input value={search} onChange={e=>setSearch(e.target.value)} className="h-11 min-w-0 flex-1 px-2 outline-none" placeholder="Buscar productos"/></form><nav className="mt-6 space-y-1"><Link href="/" className="block rounded px-3 py-3 hover:bg-[#f2f5fb]">Inicio</Link>{categoryLinks}{!authenticated?<><Link href="/login" className="block rounded px-3 py-3 hover:bg-[#f2f5fb]">Iniciar sesión</Link><Link href="/registro" className="block rounded px-3 py-3 hover:bg-[#f2f5fb]">Registrarse</Link></>:<Link href="/cuenta" className="block rounded px-3 py-3 hover:bg-[#f2f5fb]">Mi cuenta</Link>}</nav></aside></div>}
  
<MiniCart
  isOpen={cartOpen}
  onClose={() => setCartOpen(false)}
  items={items}
  totalItems={totalItems}
  subtotal={subtotal}
  onRemove={removeFromCart}
/>
  
  </header>;
}
