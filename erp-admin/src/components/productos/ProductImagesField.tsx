"use client";

import Image from "next/image";
import {
  Plus,
  Trash2,
} from "lucide-react";

interface ProductImagesFieldProps {
  value: string[];
  onAddImages: () => void;
  onRemoveImage: (
    index: number,
  ) => void;
  error?: string;
}

export function ProductImagesField({
  value,
  onAddImages,
  onRemoveImage,
  error,
}: ProductImagesFieldProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-900">
        Imágenes del producto
      </p>

      <div className="flex flex-wrap gap-3">
        {value.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="relative h-36 w-28 overflow-hidden rounded-lg bg-gray-50"
          >
            <Image
              src={imageUrl}
              alt={`Imagen ${index + 1} del producto`}
              fill
              sizes="112px"
              className="object-contain"
            />

            <button
              type="button"
              onClick={() =>
                onRemoveImage(index)
              }
              aria-label={`Eliminar imagen ${index + 1}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded border border-red-200 bg-white text-red-500"
            >
              <Trash2
                size={13}
                aria-hidden="true"
              />
            </button>
          </div>
        ))}

        {value.length < 10 && (
          <button
            type="button"
            onClick={onAddImages}
            className="flex h-36 w-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 bg-[#F8F9FC] px-2 text-center transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1C21D1]"
          >
            <Plus
              size={30}
              aria-hidden="true"
              color="#050505"
            />

            <span className="mt-3 text-xs font-semibold text-gray-900">
              Agrega imágenes
            </span>

            <span className="mt-2 text-[10px] text-gray-600">
              PNG, JPG o JPEG
            </span>

            <span className="mt-1 text-[10px] text-gray-600">
              Máx. 5MB
            </span>
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}