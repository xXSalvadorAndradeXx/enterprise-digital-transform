"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const options = [
  { value: "createdAt:DESC", label: "Más recientes" },
  { value: "salePrice:ASC", label: "Precio menor" },
  { value: "salePrice:DESC", label: "Precio mayor" },
  { value: "commercialName:ASC", label: "Nombre A–Z" },
  { value: "commercialName:DESC", label: "Nombre Z–A" },
] as const;

export default function ProductSort({ value, order }: { value: string; order: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = `${value}:${order}`;
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? "Más recientes";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const changeSort = (nextValue: string) => {
    const [sortBy, sortOrder] = nextValue.split(":");
    const query = new URLSearchParams(searchParams.toString());
    query.set("sortBy", sortBy);
    query.set("order", sortOrder);
    query.set("page", "1");
    setOpen(false);
    router.push(`${pathname}?${query.toString()}`);
  };

  return <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide">
    <span className="whitespace-nowrap">Ordenar por</span>
    <div ref={containerRef} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-w-36 items-center justify-between gap-3 rounded border border-[#B80A18] bg-white px-3 py-2 text-left text-xs normal-case text-[#4A4A4A] focus:ring-1 focus:ring-[#B80A18]">
        {selectedLabel}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div role="listbox" aria-label="Ordenar productos" className="absolute right-0 top-full z-30 mt-1 min-w-full overflow-hidden rounded border border-[#D9A0AC] bg-white py-1 text-xs normal-case shadow-lg">
        {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === selected} onClick={() => changeSort(option.value)} className={`block w-full whitespace-nowrap bg-white px-3 py-2 text-left transition-colors hover:bg-[#FDE3EE] hover:text-[#B80A18] ${option.value === selected ? "font-semibold text-[#B80A18]" : "text-[#202124]"}`}>{option.label}</button>)}
      </div>}
    </div>
  </div>;
}
