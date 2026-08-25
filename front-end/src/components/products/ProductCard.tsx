"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product, ProductImage } from "@/types/products/product.types";

type ProductCardProps = {
  product: Product;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatProductPrice(price: Product["precio"]) {
  const normalizedPrice = typeof price === "string" ? price.trim() : price;
  const numericPrice =
    normalizedPrice === "" ? Number.NaN : Number(normalizedPrice);

  if (Number.isFinite(numericPrice)) {
    return priceFormatter.format(numericPrice);
  }

  return String(price);
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [favorite,setFavorite] = useState(false);
  const backendProduct = product as Product & {
    inventory?: {
      productName?: string;
      brand?: string;
      stock?: string | number;
      totalStock?: number;
      category?: { id: number; name?: string; nombre?: string } | null;
    };
    images?: Array<ProductImage & { imageUrl?: string }>;
  };
  const name = product.commercialName ?? product.nombre ?? backendProduct.inventory?.productName ?? "Producto";
  const firstBackendImage = backendProduct.images?.[0] as { url?: string; imageUrl?: string } | undefined;
  const imageUrl = (product.primaryImage?.url ?? firstBackendImage?.url ?? firstBackendImage?.imageUrl ?? product.imagenUrl ?? "").trim();
  const stock = Number(product.stockTotal ?? product.stock ?? backendProduct.inventory?.totalStock ?? backendProduct.inventory?.stock ?? 0);
  const currentPrice = product.effectivePrice ?? product.precio;
  const originalPrice = product.salePrice;
  const rawDiscount = product.discount as unknown;
  const discountPercentage = typeof rawDiscount === "number"
    ? rawDiscount
    : rawDiscount && typeof rawDiscount === "object" && "percentage" in rawDiscount
      ? Number((rawDiscount as { percentage?: number }).percentage ?? 0)
      : 0;
  const hasActiveDiscount = discountPercentage > 0 && Number(currentPrice) < Number(originalPrice ?? currentPrice);
  const brand = product.brand ?? backendProduct.inventory?.brand ?? "Woden";
  const isAvailable = product.availability
    ? product.availability !== "OUT_OF_STOCK"
    : stock > 0;
  const shouldShowImage = imageUrl.length > 0 && failedImageUrl !== imageUrl;
  const detailHref = `/producto/${product.id}`;

  useEffect(()=>{const timer=window.setTimeout(()=>{try{const values=JSON.parse(localStorage.getItem("woden-wishlist")??"[]") as Array<string|number>;setFavorite(values.map(String).includes(String(product.id)))}catch{}},0);return()=>window.clearTimeout(timer)},[product.id]);
  const toggleFavorite=()=>{const next=!favorite;setFavorite(next);try{const values=JSON.parse(localStorage.getItem("woden-wishlist")??"[]") as Array<string|number>;const ids=new Set(values.map(String));if(next){ids.add(String(product.id))}else{ids.delete(String(product.id))}localStorage.setItem("woden-wishlist",JSON.stringify([...ids]))}catch{}};

  return (
    <article
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-[#e0e3e8] bg-white p-4 transition hover:shadow-lg"
      role="link"
      tabIndex={0}
      onClick={(event)=>{if(!(event.target as HTMLElement).closest("a,button"))router.push(detailHref)}}
      onKeyDown={(event)=>{if(event.key==="Enter")router.push(detailHref)}}
      aria-label={`Ver detalle de ${name}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F7FB]">
        {hasActiveDiscount ? <span className="absolute left-2 top-2 z-10 rounded bg-[#ff3b30] px-2 py-1 text-xs font-bold text-white">-{discountPercentage}%</span> : null}
        <button onClick={toggleFavorite} aria-label={favorite?"Quitar de favoritos":"Agregar a favoritos"} className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 shadow"><Heart className={`h-4 w-4 ${favorite?"fill-red-500 text-red-500":""}`}/></button>
        {shouldShowImage ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAF3FF] to-[#F4F7FB] px-6 text-center">
            <span className="rounded-full border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold uppercase leading-5">{brand}</p>
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#111111]">
              {name}
            </h3>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isAvailable
                ? "border border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]"
                : "border border-[#D9E2EC] bg-[#F4F7FB] text-slate-500"
            }`}
          >
            {isAvailable ? "Disponible" : "Agotado"}
          </span>
        </div>

        <div className="mt-auto grid gap-3 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Precio
            </p>
            <p className={`mt-0.5 truncate text-xl font-extrabold ${hasActiveDiscount?"text-[#ff2d20]":"text-[#111111]"}`}>
              {formatProductPrice(currentPrice)}
            </p>
            {hasActiveDiscount && originalPrice ? <p className="text-sm text-slate-500 line-through">{formatProductPrice(originalPrice)}</p> : null}
            <p className="mt-1 text-xs font-medium text-slate-500">
              <span className="text-green-600">●</span> {stock} unidades disponibles
            </p>
          </div>
          <div className="grid grid-cols-[1fr_42px] gap-2"><Link href={detailHref} className={`inline-flex h-10 items-center justify-center rounded-lg bg-[#1822d9] px-3 text-sm font-semibold text-white ${!isAvailable?"pointer-events-none opacity-50":""}`}>Comprar ahora</Link><Link href={detailHref} aria-label={`Seleccionar ${name}`} className="flex h-10 items-center justify-center rounded-lg bg-[#dbe6ff] text-[#1822d9]"><ShoppingCart className="h-4 w-4"/></Link></div>
        </div>
      </div>
    </article>
  );
}
