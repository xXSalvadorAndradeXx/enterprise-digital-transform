"use client";

import {
  useEffect,
  useRef,
} from "react";

import { formatCurrency } from "@/utils/formatCurrency";

import { ProductBasicInformation } from "./ProductBasicInformation";
import { ProductDiscountCard } from "./ProductDiscountCard";
import { ProductGallery } from "./ProductGallery";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { ProductTags } from "./ProductTags";

import type {
  ProductPreviewData,
} from "@/types/productos";

interface ProductPreviewProps {
  product: ProductPreviewData;
  onClose: () => void;
  onEdit: () => void;
}

export function ProductPreview({
  product,
  onClose,
  onEdit,
}: ProductPreviewProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement;

    containerRef.current?.focus();

    const handleKeyDown = (
      event: KeyboardEvent,
    ): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      if (
        previouslyFocused instanceof
        HTMLElement
      ) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  const hasDiscount =
    product.discount > 0;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby="product-preview-title"
      className="rounded-xl border border-gray-300 bg-white p-5 outline-none md:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          images={product.images}
          productName={
            product.commercialName
          }
        />

        <section>
          <h2
            id="product-preview-title"
            className="break-words text-xl font-semibold text-gray-900"
          >
            {product.commercialName}
          </h2>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
            className="inline-flex min-h-9 max-w-[180px] items-center truncate rounded-md bg-[#F2F5FC] px-3 py-2 text-xs text-gray-600"
            title={product.category}
            >
            {product.category}
            </span>

            <span
              className="max-w-[240px] truncate text-sm text-gray-500"
              title={product.sku}
            >
              {product.sku}
            </span>
          </div>

          <div className="mt-6">
            
            <p className="text-3xl font-semibold text-[#1C21D1]">
              {formatCurrency(
                hasDiscount
                  ? product.effectivePrice
                  : product.salePrice,
              )}
            </p>
          </div>

        <span
        className="inline-flex min-h-9 mt-5 items-center rounded-md bg-[rgba(52,198,29,0.20)] px-3 py-2 text-sm font-medium text-gray-700"
        >
        En stock
        </span>

          <hr className="my-5 border-gray-300" />

          <section>
            <h3 className="text-sm font-semibold text-gray-900">
              Descripción
            </h3>

            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
              {product.description?.trim() ||
                "Sin descripción"}
            </p>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-gray-900">
                Etiquetas
            </h3>

            <div className="mt-5">
                <ProductTags
                tags={product.tags}
                />
            </div>
            </section>
        </section>
      </div>

      <div className="my-10 border-t border-gray-300" />

      <div className="grid gap-8 lg:grid-cols-2 lg:divide-x lg:divide-gray-300">
        <div className="lg:pr-8">
          <ProductBasicInformation
            category={product.category}
            salePrice={product.salePrice}
            stock={product.stock}
            stockLabel={product.stockLabel}
            />
        </div>

        <div className="lg:pl-8">
          {hasDiscount ? (
            <ProductDiscountCard
              salePrice={
                product.salePrice
              }
              discount={
                product.discount
              }
              effectivePrice={
                product.effectivePrice
              }
            />
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Información de descuento
              </h3>

              <p className="mt-4 text-sm text-gray-500">
                Este producto no tiene
                un descuento activo.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-w-36 rounded-md border border-[#1C21D1] px-6 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-[#1C21D1] focus:ring-offset-2"
        >
          Cerrar
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="min-w-36 rounded-md bg-[#1C21D1] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] focus:outline-none focus:ring-2 focus:ring-[#1C21D1] focus:ring-offset-2"
        >
          Editar
        </button>
      </div>
    </div>
  );
}