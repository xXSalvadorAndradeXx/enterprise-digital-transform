"use client";

import type { ProductImage } from "@/types/products/product.types";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [selected,setSelected]=useState(0); const [failed,setFailed]=useState<string[]>([]);
  const current=images[selected];
  const move=(direction:number)=>setSelected(value=>(value+direction+images.length)%images.length);
  if(!images.length)return <div className="flex aspect-square items-center justify-center bg-[#f5f5f5] text-slate-400"><ImageOff className="h-12 w-12"/><span className="ml-3">Sin imágenes</span></div>;
  return <div>
    <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
      {!failed.includes(current.url)?<Image src={current.url} alt={current.alt||productName} fill priority unoptimized className="object-contain p-6" onError={()=>setFailed(v=>[...v,current.url])}/>:<div className="flex h-full items-center justify-center text-slate-400"><ImageOff className="h-12 w-12"/></div>}
      {images.length>1&&<><button onClick={()=>move(-1)} aria-label="Imagen anterior" className="absolute left-3 top-1/2 rounded-full bg-white p-2 shadow"><ChevronLeft/></button><button onClick={()=>move(1)} aria-label="Imagen siguiente" className="absolute right-3 top-1/2 rounded-full bg-white p-2 shadow"><ChevronRight/></button></>}
    </div>
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{images.map((image,index)=><button key={image.id||image.url} onClick={()=>setSelected(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden border-2 bg-[#f5f5f5] ${selected===index?"border-[#1822d9]":"border-transparent"}`} aria-label={`Ver imagen ${index+1}`}>{!failed.includes(image.url)&&<Image src={image.url} alt="" fill unoptimized className="object-contain p-1" onError={()=>setFailed(v=>[...v,image.url])}/>}</button>)}</div>
  </div>;
}
