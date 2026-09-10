"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  formatCurrency,
} from "@/utils/formatCurrency";

import {
  ProductBasicInformation,
} from "./ProductBasicInformation";

import {
  ProductDiscountCard,
} from "./ProductDiscountCard";

import {
  ProductGallery,
} from "./ProductGallery";

import {
  ProductTags,
} from "./ProductTags";

import type {
  ProductDetail,
} from "@/types/productos";

interface ProductPreviewProps {
  product:
    ProductDetail;

  onClose:
    () => void;

  onEdit:
    () => void;
}

export function ProductPreview({
  product,
  onClose,
  onEdit,
}: ProductPreviewProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(() => {
    const previouslyFocused =
      document.activeElement;

    containerRef.current?.focus();

    const handleKeyDown = (
      event: KeyboardEvent,
    ): void => {
      if (
        event.key ===
        "Escape"
      ) {
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
  }, [
    onClose,
  ]);

  const hasDiscount =
    product.discount !==
      null &&
    product.discount > 0;

  const inventory =
    product.inventory;

  const category =
    inventory?.category?.name ??
    "Sin categoría";

  const stock =
    inventory?.totalStock ??
    0;

  const inventoryStatus =
    inventory?.status;

  const stockLabel =
    !inventory
      ? "Sin información"
      : inventoryStatus ===
          "OUT_OF_STOCK"
        ? "Sin stock"
        : inventoryStatus ===
            "LOW_STOCK"
          ? "Stock bajo"
          : "En stock";

  return (
    <div
      ref={
        containerRef
      }
      tabIndex={
        -1
      }
      aria-labelledby="product-preview-title"
      className="rounded-xl border border-gray-200 bg-white p-6 outline-none shadow-sm sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          images={
            product.images
          }
          productName={
            product.commercialName
          }
        />

        <section>
          <h2
            id="product-preview-title"
            className="break-words text-2xl font-bold text-gray-900"
          >
            {
              product.commercialName
            }
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center rounded-md bg-[#F2F4F7] px-2.5 py-1 text-xs font-medium text-gray-700"
              title={
                category
              }
            >
              {
                category
              }
            </span>

            {product.inventory && (
              <span className="text-xs font-medium text-gray-500">
                {product.inventory.brand || ""}
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                hasDiscount
                  ? product.effectivePrice
                  : product.salePrice,
              )}
            </p>
          </div>

          <span
            className={`mt-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
              !inventory
                ? "bg-gray-100 text-gray-600"
                : inventoryStatus ===
                    "OUT_OF_STOCK"
                  ? "bg-red-100 text-red-700"
                  : inventoryStatus ===
                      "LOW_STOCK"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-[#D1FADF] text-[#027A48]"
            }`}
          >
            {
              stockLabel
            }
          </span>

          <hr className="my-5 border-gray-200" />

          <section>
            <h3 className="text-sm font-semibold text-gray-900">
              Descripción
            </h3>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
              {product.description
                ?.trim() ||
                "Sin descripción"}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Etiquetas
            </h3>

            <div className="mt-3">
              <ProductTags
                tags={
                  product.tags
                }
              />
            </div>
          </section>
        </section>
      </div>

      <hr className="my-8 border-gray-200" />

      <div className="grid gap-8 lg:grid-cols-2 lg:divide-x lg:divide-gray-200">
        <div className="lg:pr-8">
          <ProductBasicInformation
            category={
              category
            }
            salePrice={
              product.salePrice
            }
            stock={
              stock
            }
            stockLabel={
              stockLabel
            }
          />
        </div>

        <div className="lg:pl-8">
          <ProductDiscountCard
            salePrice={
              product.salePrice
            }
            discount={
              product.discount ?? 0
            }
            effectivePrice={
              product.effectivePrice
            }
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={
            onClose
          }
          className="min-w-32 rounded-md border border-[#B80A18] px-6 py-2 text-sm font-medium text-[#B80A18] transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Cerrar
        </button>

        <button
          type="button"
          onClick={
            onEdit
          }
          className="min-w-32 rounded-md bg-[#B80A18] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9E0915] focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Editar
        </button>
      </div>
    </div>
  );
}