"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, ImageIcon } from "lucide-react";

import type { ProductPreviewImage } from "@/types/productos";

import Image from "next/image";

interface ProductGalleryProps {
  images: ProductPreviewImage[];
  productName: string;
}

export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const sortedImages = useMemo(
    () =>
      [...images].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    [images],
  );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const selectedImage =
    sortedImages[selectedIndex];

  const handlePrevious = (): void => {
    setSelectedIndex((current) =>
      current === 0
        ? sortedImages.length - 1
        : current - 1,
    );
  };

  const handleNext = (): void => {
    setSelectedIndex((current) =>
      current === sortedImages.length - 1
        ? 0
        : current + 1,
    );
  };

  if (sortedImages.length === 0) {
    return (
      <div className="flex min-h-[380px] items-center justify-center rounded-xl bg-gray-50">
        <div className="text-center text-gray-400">
          <ImageIcon
            size={48}
            className="mx-auto"
            aria-hidden="true"
          />

          <p className="mt-2 text-sm">
            Sin imágenes disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={`Galería de ${productName}`}
      className="space-y-4"
    >
      <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
        <Image
          src={selectedImage.imageUrl}
          alt={`${productName} - imagen ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
          unoptimized
        />

        {/* Favorite button */}
        <button
          type="button"
          aria-label="Agregar a favoritos"
          className="absolute right-3.5 top-3.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-105"
        >
          <Heart
            size={18}
            className="text-gray-700"
          />
        </button>

        {/* Carousel overlay arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Imagen anterior"
              className="absolute left-3.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-105"
            >
              <ArrowLeft
                size={18}
                className="text-gray-800"
              />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Imagen siguiente"
              className="absolute right-3.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-105"
            >
              <ArrowRight
                size={18}
                className="text-gray-800"
              />
            </button>
          </>
        )}
      </div>

      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {sortedImages.map((image, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${productName}`}
                aria-current={isSelected ? "true" : undefined}
                className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-gray-900 shadow-sm"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
