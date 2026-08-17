"use client";

import {
  ChangeEvent,
  useRef,
} from "react";

import Image from "next/image";

import {
  Plus,
  Trash2,
} from "lucide-react";

import type {
  ProductImagePreview,
} from "@/types/productos/product-image-form.types";

interface ProductImagesFieldProps {
  images: ProductImagePreview[];

  onFilesSelected: (
    files: File[],
  ) => void;

  onRemoveImage: (
    id: string,
  ) => void;

  error?: string;
}

export function ProductImagesField({
  images,
  onFilesSelected,
  onRemoveImage,
  error,
}: ProductImagesFieldProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const files =
      Array.from(
        event.target.files ?? [],
      );

    if (files.length === 0) {
      return;
    }

    onFilesSelected(files);

    /*
     * Permite volver a seleccionar
     * posteriormente el mismo archivo.
     */
    event.target.value = "";
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-900">
        Imágenes del producto
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={
          handleFileChange
        }
        className="hidden"
        aria-label="Seleccionar imágenes del producto"
      />

      <div className="flex flex-wrap gap-3">
        {images.map(
          (image, index) => (
            <div
              key={image.id}
              className="relative h-36 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <Image
                src={
                  image.previewUrl
                }
                alt={`Imagen ${index + 1} del producto`}
                fill
                sizes="112px"
                className="object-contain"
              />

              <button
                type="button"
                onClick={() =>
                  onRemoveImage(
                    image.id,
                  )
                }
                aria-label={`Eliminar imagen ${index + 1}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-white text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <Trash2
                  size={14}
                  aria-hidden="true"
                />
              </button>
            </div>
          ),
        )}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="flex h-36 w-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 bg-[#F8F9FC] px-2 text-center transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1C21D1]"
          >
            <Plus
              size={34}
              strokeWidth={1.7}
              aria-hidden="true"
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
          className="mt-2 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}