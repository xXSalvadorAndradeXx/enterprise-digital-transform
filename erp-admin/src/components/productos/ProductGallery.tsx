"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

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
    >
      <div className="flex min-h-[380px] items-center justify-center overflow-hidden rounded-xl">
        <div className="relative h-[380px] w-full">
            <Image
            src={selectedImage.imageUrl}
            alt={`${productName} - imagen ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            priority
            />
        </div>
        </div>

      {sortedImages.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Imagen anterior"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1C21D1]"
          >
            <ChevronLeft
              size={24}
              aria-hidden="true"
            />
          </button>

          <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto py-1">
            {sortedImages.map(
              (image, index) => {
                const isSelected =
                  index === selectedIndex;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`Ver imagen ${index + 1} de ${productName}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={`h-24 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus:outline-none ${
                        isSelected
                        ? "border-gray-900"
                        : "border-transparent"
                    }`}
                    >
                    <div className="relative h-full w-full">
                        <Image
                        src={image.imageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                        />
                    </div>
                    </button>
                );
              },
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Imagen siguiente"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1C21D1]"
          >
            <ChevronRight
              size={24}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </section>
  );
}