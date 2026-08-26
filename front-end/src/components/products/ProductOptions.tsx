"use client";

import type { Product, ProductVariant } from "@/types/products/product.types";
import { useCart } from "@/hooks/cart/useCart";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";

export default function ProductOptions({product,variants}:{product:Product;variants:ProductVariant[]}) {
  const {addToCart}=useCart();
  const colors=useMemo(()=>Array.from(new Map(variants.map(v=>[v.color.name,v.color])).values()),[variants]);
  const [color,setColor]=useState(colors[0]?.name??""); const [size,setSize]=useState(()=>variants.find(v=>v.color.name===(colors[0]?.name??"")&&v.available&&v.stock>0)?.size??""); const [quantity,setQuantity]=useState(1);
  const [isAdding,setIsAdding]=useState(false); const [cartError,setCartError]=useState("");
  const sizes=variants.filter(v=>v.color.name===color); const selected=variants.find(v=>v.color.name===color&&v.size===size);
  const available=Boolean(selected?.available&&selected.stock>0);
  const chooseColor=(value:string)=>{setColor(value);setSize(variants.find(v=>v.color.name===value&&v.available&&v.stock>0)?.size??"");setQuantity(1)};
  const handleAddToCart=async()=>{if(!selected||!available||isAdding)return;setCartError("");setIsAdding(true);try{await addToCart(product,selected,quantity)}catch(error){setCartError(error instanceof Error?error.message:"No se pudo agregar el producto al carrito.")}finally{setIsAdding(false)}};
  return <div className="mt-6 space-y-5">
    {colors.length>0&&<div><p className="mb-3 text-sm font-semibold">Color <span className="font-normal text-slate-500">{color}</span></p><div className="flex flex-wrap gap-3">{colors.map(item=><button type="button" key={item.name} onClick={()=>chooseColor(item.name)} aria-label={`Seleccionar color ${item.name}`} title={item.name} className={`h-8 w-8 rounded-full border-2 ${color===item.name?"border-[#1822d9] ring-2 ring-blue-100":"border-slate-300"}`} style={{backgroundColor:item.hex}}/>)}</div></div>}
    {sizes.length>0&&<div><p className="mb-3 text-sm font-semibold">Talla</p><div className="flex flex-wrap gap-2">{sizes.map(item=><button type="button" key={item.id} disabled={!item.available||item.stock<=0} onClick={()=>{setSize(item.size);setQuantity(1)}} className={`min-w-10 border px-3 py-2 text-sm ${size===item.size?"border-[#1822d9] bg-[#1822d9] text-white":"border-slate-300"} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}>{item.size}</button>)}</div></div>}
    <div><p className="mb-3 text-sm font-semibold">Cantidad</p><div className="flex flex-wrap items-center gap-3"><div className="inline-flex h-11 items-center overflow-hidden rounded-md border border-[#d9dde5] bg-[#f2f5fb]"><button type="button" aria-label="Disminuir cantidad" disabled={quantity<=1||isAdding} onClick={()=>setQuantity(v=>Math.max(1,v-1))} className="flex h-full w-10 items-center justify-center disabled:opacity-30"><Minus className="h-4 w-4"/></button><span className="min-w-8 text-center text-sm font-medium">{quantity}</span><button type="button" aria-label="Aumentar cantidad" disabled={!selected||quantity>=selected.stock||isAdding} onClick={()=>setQuantity(v=>Math.min(selected?.stock??1,v+1))} className="flex h-full w-10 items-center justify-center disabled:opacity-30"><Plus className="h-4 w-4"/></button></div><button type="button" onClick={()=>void handleAddToCart()} disabled={!available||isAdding} className="flex h-11 min-w-44 items-center justify-center gap-2 rounded bg-[#1822d9] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingCart className="h-4 w-4"/>{isAdding?"Agregando...":"Añadir al carrito"}</button></div>{selected&&<p className="mt-2 text-xs text-slate-500">Máximo {selected.stock} unidades</p>}{cartError&&<p role="alert" className="mt-2 text-sm text-red-600">{cartError}</p>}</div>
    {!available&&size&&<p className="text-sm text-red-600">Esta combinación no tiene stock disponible.</p>}
    <div className="flex flex-wrap gap-8 border-t border-[#eef0f4] pt-7"><div className="flex h-14 w-28 items-center justify-center rounded border border-[#9ca3af] text-2xl font-black italic text-[#1624c7]">VISA</div><div className="flex h-14 w-28 flex-col items-center justify-center rounded border border-[#9ca3af]"><span className="flex -space-x-2"><i className="h-6 w-6 rounded-full bg-[#eb001b]"/><i className="h-6 w-6 rounded-full bg-[#f79e1b]"/></span><span className="mt-0.5 text-[8px] font-semibold">mastercard</span></div><div className="flex h-14 w-28 items-center justify-center rounded border border-[#9ca3af] text-lg font-bold italic text-[#174ea6]">PayPal</div></div>
  </div>;
}
