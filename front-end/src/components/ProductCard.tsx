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
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_18px_45px_rgba(37,99,235,0.14)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={product.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 px-6 text-center">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.category ? (
              <p className="mb-2 inline-flex max-w-full rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <span className="truncate">{product.category.nombre}</span>
              </p>
            ) : null}

            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-gray-950">
              {product.nombre}
            </h3>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              isAvailable
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isAvailable ? "Disponible" : "Agotado"}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
          {product.descripcion}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">
              Precio
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-950">
              {formatProductPrice(product.precio)}
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Stock: {product.stock}
            </p>
          </div>

          <Link
            href={`/producto/${product.id}`}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 ${
              isAvailable
                ? "bg-blue-600 text-white hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
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
