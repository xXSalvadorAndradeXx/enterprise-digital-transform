"use client";

import type { ProductCategory } from "@/types/products/product.types";
import { SlidersHorizontal, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type ProductFilterValues = {
  search: string; categoryId: string; brand: string; gender: string; size: string;
  minPrice: string; maxPrice: string; availability: string; hasDiscount: string;
  sortBy: string; order: string;
};

const emptyFilters: ProductFilterValues = { search:"",categoryId:"",brand:"",gender:"",size:"",minPrice:"",maxPrice:"",availability:"",hasDiscount:"",sortBy:"createdAt",order:"DESC" };
const brands=["Adidas","Nike","Puma","New Balance"];
const sizes=["S","M","L","XL","XXL"];

export default function ProductFilters({initialFilters}:{categories:ProductCategory[];initialFilters:ProductFilterValues}) {
  const router=useRouter();
  const [filters,setFilters]=useState(initialFilters);
  const [mobileOpen,setMobileOpen]=useState(false);
  const selectedBrands=filters.brand.split(",").filter(Boolean);

  const toggleBrand=(brand:string)=>setFilters(current=>{
    const values=new Set(current.brand.split(",").filter(Boolean));
    if(values.has(brand))values.delete(brand);else values.add(brand);
    return {...current,brand:[...values].join(",")};
  });
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    const query=new URLSearchParams({page:"1",limit:"12"});
    Object.entries(filters).forEach(([key,value])=>value&&query.set(key,value));
    router.push(`/productos?${query}`);
    setMobileOpen(false);
  };
  const clear=()=>{setFilters(emptyFilters);router.push("/productos?page=1&limit=12")};

  const controls=<>
    <p className="text-sm font-medium uppercase">Filtros:</p>
    <fieldset className="mt-3"><legend className="text-base font-medium">Marca</legend><div className="mt-3 space-y-2">{brands.map(brand=><label key={brand} className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={()=>toggleBrand(brand)} className="h-4 w-4 rounded border-[#9ca3af] accent-black"/>{brand}</label>)}</div></fieldset>
    <fieldset className="mt-9"><legend className="text-base font-medium">Género</legend><div className="mt-4 flex gap-6">{[["MEN","Hombre"],["WOMEN","Mujer"]].map(([value,label])=><label key={value} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="gender" value={value} checked={filters.gender===value} onChange={event=>setFilters(current=>({...current,gender:event.target.value}))} className="h-5 w-5 accent-black"/>{label}</label>)}</div></fieldset>
    <fieldset className="mt-10"><legend className="text-base font-medium">Talla</legend><div className="mt-3 flex flex-wrap gap-2">{sizes.map(size=><button key={size} type="button" onClick={()=>setFilters(current=>({...current,size:current.size===size?"":size}))} className={`h-10 min-w-10 rounded border px-3 text-xs ${filters.size===size?"border-black bg-black text-white":"border-[#edf0f4] bg-white"}`}>{size}</button>)}</div></fieldset>
    <fieldset className="mt-9"><legend className="text-base font-medium">Precio</legend><div className="mt-4"><input type="range" min="0" max="500" step="5" value={filters.maxPrice||500} onChange={event=>setFilters(current=>({...current,maxPrice:event.target.value==="500"?"":event.target.value}))} className="w-full accent-[#4b4b4b]"/><div className="mt-1 flex justify-center"><span className="rounded bg-[#3f3f3f] px-3 py-1 text-xs text-white">${Number(filters.maxPrice||500).toFixed(2)}</span></div></div></fieldset>
    <div className="mt-8 grid grid-cols-2 gap-2"><button className="h-10 bg-[#1822d9] px-3 text-sm font-semibold text-white">Aplicar</button><button type="button" onClick={clear} className="h-10 border border-[#d7dbe2] px-3 text-sm">Limpiar</button></div>
  </>;

  return <>
    <button onClick={()=>setMobileOpen(true)} className="flex w-full items-center justify-center gap-2 border py-3 font-semibold lg:hidden"><SlidersHorizontal className="h-4 w-4"/>Filtros</button>
    <form onSubmit={submit} className="sticky top-[165px] hidden self-start border-r border-[#eef0f4] pr-7 lg:block">{controls}</form>
    {mobileOpen&&<div className="fixed inset-0 z-[70] bg-black/30 lg:hidden" onMouseDown={event=>event.target===event.currentTarget&&setMobileOpen(false)}><form onSubmit={submit} className="ml-auto h-full w-[min(90vw,360px)] overflow-y-auto bg-white p-6"><div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-bold">Filtros</h2><button type="button" onClick={()=>setMobileOpen(false)} aria-label="Cerrar filtros"><X/></button></div>{controls}</form></div>}
  </>;
}
