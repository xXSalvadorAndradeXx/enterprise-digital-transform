"use client";

import { Controller } from "react-hook-form";

import {
  PRODUCT_DISCOUNT_OPTIONS,
  PRODUCT_PUBLICATION_OPTIONS,
} from "@/constants/productos/product-form.constants";

import { ProductImagesField } from "./ProductImagesField";
import { ProductTagsInput } from "./ProductTagsInput";

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

interface ProductManualFieldsProps {
  register: UseFormRegister<ProductFormSchema>;
  control: Control<ProductFormSchema>;
  errors: FieldErrors<ProductFormSchema>;
  watch: UseFormWatch<ProductFormSchema>;

  onAddImages: () => void;

  onRemoveImage: (
    index: number,
  ) => void;
}

const inputClass =
  "h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]";
export function ProductManualFields({
  register,
  control,
  errors,
  watch,
  onAddImages,
  onRemoveImage,
}: ProductManualFieldsProps) {
  const applyDiscount =
    watch("applyDiscount");

  const images =
    watch("imageUrls");

  return (
    <section className="min-w-0 border-t border-gray-300 p-6 lg:border-l lg:border-t-0">
      <h2 className="text-lg font-semibold text-gray-900">
        Ingreso manual
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-gray-900">
            Nombre
            </label>

            <input
            {...register("commercialName")}
            placeholder="Nombre Comercial"
            className={inputClass}
            />

            {errors.commercialName && (
            <p className="mt-1 text-xs text-red-500">
                {errors.commercialName.message}
            </p>
            )}
        </div>

        <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-gray-900">
            Precio de venta
            </label>

            <input
            {...register("salePrice")}
            type="text"
            inputMode="decimal"
            placeholder="$ 00.00"
            onInput={(event) => {
                const input = event.currentTarget;

                input.value = input.value
                .replace(/[^0-9.]/g, "")
                .replace(/(\..*)\./g, "$1");
            }}
            className={inputClass}
            />

            {errors.salePrice && (
            <p className="mt-1 text-xs text-red-500">
                {errors.salePrice.message}
            </p>
            )}
        </div>
        </div>

      <div className="mt-7">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-900">
          <input
            {...register(
              "applyDiscount",
            )}
            type="checkbox"
            className="h-5 w-5 accent-[#1C21D1]"
          />

          Aplicar descuento
        </label>
      </div>

      {applyDiscount && (
        <div className="mt-4 space-y-6">
          <div className="w-full max-w-[220px]">
            <label className="mb-2 block text-sm font-medium text-gray-900">
                Descuento
            </label>

            <select
                {...register("discount")}
                className={inputClass}
            >
                {PRODUCT_DISCOUNT_OPTIONS.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </option>
                ))}
            </select>

            {errors.discount && (
                <p className="mt-1 text-xs text-red-500">
                {errors.discount.message}
                </p>
            )}
            </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-900">
              Duración de descuento
            </p>

            <div className="w-full max-w-[220px]">
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Fecha de fin
              </label>

              <input
                {...register(
                  "discountEndsAt",
                )}
                type="date"
                className={inputClass}
              />

              {errors.discountEndsAt && (
                <p className="mt-1 text-xs text-red-500">
                  {
                    errors
                      .discountEndsAt
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-7">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Descripción comercial
        </label>

        <textarea
          {...register("description")}
          rows={4}
          placeholder="Descripción del producto"
          className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
        />

        {errors.description && (
          <p className="mt-1 text-xs text-red-500">
            {
              errors.description
                .message
            }
          </p>
        )}
      </div>

      <div className="mt-7">
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <ProductTagsInput
              value={field.value}
              onChange={
                field.onChange
              }
              error={
                errors.tags
                  ?.message
              }
            />
          )}
        />
      </div>

      <div className="mt-7">
        <ProductImagesField
          value={images}
          onAddImages={onAddImages}
          onRemoveImage={
            onRemoveImage
          }
          error={
            errors.imageUrls
              ?.message
          }
        />
      </div>

<div className="mt-7 w-full max-w-[300px]">
  <label
    htmlFor="publication-status"
    className="sr-only"
  >
    Estado de publicación
  </label>

  <select
    id="publication-status"
    {...register("status")}
    className={inputClass}
  >
    <option value="" disabled hidden>
      Estado de publicación
    </option>

    {PRODUCT_PUBLICATION_OPTIONS.map(
      (option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ),
    )}
  </select>

  {errors.status && (
    <p className="mt-1 text-xs text-red-500">
      {errors.status.message}
    </p>
  )}
</div>
    </section>
  );
}