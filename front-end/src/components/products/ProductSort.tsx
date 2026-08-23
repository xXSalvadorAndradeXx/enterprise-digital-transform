"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProductSort({ value, order }: { value: string; order: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = `${value}:${order}`;

  const changeSort = (nextValue: string) => {
    const [sortBy, sortOrder] = nextValue.split(":");
    const query = new URLSearchParams(searchParams.toString());
    query.set("sortBy", sortBy);
    query.set("order", sortOrder);
    query.set("page", "1");
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <label className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide">
      <span className="whitespace-nowrap">Ordenar por</span>
      <select
        value={selected}
        onChange={(event) => changeSort(event.target.value)}
        className="min-w-8 cursor-pointer border-0 bg-transparent py-2 text-xs outline-none"
        aria-label="Ordenar productos"
      >
        <option value="createdAt:DESC">Más recientes</option>
        <option value="salePrice:ASC">Precio menor</option>
        <option value="salePrice:DESC">Precio mayor</option>
        <option value="commercialName:ASC">Nombre A–Z</option>
        <option value="commercialName:DESC">Nombre Z–A</option>
      </select>
    </label>
  );
}
