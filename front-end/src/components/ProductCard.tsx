"use client";

/* eslint-disable @next/next/no-img-element -- Product image hosts are backend-provided and not fixed in next.config.ts. */
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types/product";

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
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageUrl = product.imagenUrl.trim();
  const isAvailable = product.stock > 0;
  const shouldShowImage = imageUrl.length > 0 && failedImageUrl !== imageUrl;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_10px_24px_rgba(17,17,17,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#005BFF] hover:shadow-[0_18px_42px_rgba(0,55,145,0.14)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F7FB]">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={product.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
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

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            {product.category ? (
              <p className="mb-2 inline-flex max-w-full rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-2.5 py-1 text-xs font-semibold text-[#003791]">
                <span className="truncate">{product.category.nombre}</span>
              </p>
            ) : null}

            <h3 className="line-clamp-2 text-base font-bold leading-5 text-[#111111]">
              {product.nombre}
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

        <p className="mt-2.5 line-clamp-2 text-sm leading-5 text-slate-600">
          {product.descripcion}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#D9E2EC] pt-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Precio
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-[#111111]">
              {formatProductPrice(product.precio)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Stock: {product.stock}
            </p>
          </div>

          <Link
            href={`/producto/${product.id}`}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-300 ${
              isAvailable
                ? "bg-[#003791] text-white hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md"
                : "border border-[#D9E2EC] bg-[#F4F7FB] text-slate-500 hover:bg-[#EAF3FF]"
            }`}
            aria-label={`Ver producto ${product.nombre}`}
          >
            Ver producto
          </Link>
        </div>
      </div>
    </article>
  );
}
