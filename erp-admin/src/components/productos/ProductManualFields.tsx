"use client";

import {
  useMemo,
} from "react";

import {
  Controller,
} from "react-hook-form";

import {
  PRODUCT_DISCOUNT_OPTIONS,
  PRODUCT_PUBLICATION_OPTIONS,
} from "@/constants/productos/product-form.constants";

import {
  ProductImagesField,
} from "./ProductImagesField";

import {
  ProductTagsInput,
} from "./ProductTagsInput";

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import type {
  ProductFormInput,
} from "@/types/productos/schemas";

import {
  calculateProductPreviewPrice,
} from "@/utils/calculateProductPreviewPrice";

import type {
  ProductImagePreview,
} from "@/types/productos/product-image-form.types";

interface ProductManualFieldsProps {
  register:
    UseFormRegister<ProductFormInput>;

  control:
    Control<ProductFormInput>;

  errors:
    FieldErrors<ProductFormInput>;

  watch:
    UseFormWatch<ProductFormInput>;

  setValue:
    UseFormSetValue<ProductFormInput>;

  images:
    ProductImagePreview[];

  imageError:
    string | null;

  onFilesSelected: (
    files: File[],
  ) => void;

  onRemoveImage: (
    id: string,
  ) => void;
}

const inputClass =
  "h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]";

export function ProductManualFields({
  register,
  control,
  errors,
  watch,
  setValue,
  images,
  imageError,
  onFilesSelected,
  onRemoveImage,
}: ProductManualFieldsProps) {
  const applyDiscount =
    watch(
      "applyDiscount",
    );

  const salePrice =
    watch(
      "salePrice",
    );

  const discount =
    watch(
      "discount",
    );

  const previewPrice =
    useMemo(
      () =>
        calculateProductPreviewPrice(
          salePrice,
          discount,
          applyDiscount,
        ),
      [
        salePrice,
        discount,
        applyDiscount,
      ],
    );

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
            {...register(
              "commercialName",
            )}
            placeholder="Nombre Comercial"
            className={
              inputClass
            }
          />

          {errors.commercialName && (
            <p className="mt-1 text-xs text-red-500">
              {
                errors
                  .commercialName
                  .message
              }
            </p>
          )}
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Precio de venta
          </label>

          <input
            {...register(
              "salePrice",
            )}
            type="text"
            inputMode="decimal"
            placeholder="$ 00.00"
            onInput={(
              event,
            ) => {
              const input =
                event.currentTarget;

              input.value =
                input.value
                  .replace(
                    /[^0-9.]/g,
                    "",
                  )
                  .replace(
                    /(\..*)\./g,
                    "$1",
                  );
            }}
            className={
              inputClass
            }
          />

          {errors.salePrice && (
            <p className="mt-1 text-xs text-red-500">
              {
                errors
                  .salePrice
                  .message
              }
            </p>
          )}
        </div>
      </div>

      <div className="mt-7">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-900">
          <input
            type="checkbox"
            checked={
              applyDiscount
            }
            onChange={(
              event,
            ) => {
              const checked =
                event
                  .target
                  .checked;

              setValue(
                "applyDiscount",
                checked,
                {
                  shouldDirty:
                    true,

                  shouldValidate:
                    true,
                },
              );

              if (
                !checked
              ) {
                setValue(
                  "discount",
                  "",
                  {
                    shouldDirty:
                      true,

                    shouldValidate:
                      true,
                  },
                );

                setValue(
                  "discountStartsAt",
                  "",
                  {
                    shouldDirty:
                      true,

                    shouldValidate:
                      true,
                  },
                );

                setValue(
                  "discountEndsAt",
                  "",
                  {
                    shouldDirty:
                      true,

                    shouldValidate:
                      true,
                  },
                );
              }
            }}
            className="h-5 w-5 accent-[#1C21D1]"
          />

          Aplicar descuento
        </label>
      </div>

      <div className="mt-4 space-y-6">
        <div className="w-full max-w-[220px]">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Descuento
          </label>

          <select
            {...register(
              "discount",
            )}
            disabled={
              !applyDiscount
            }
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
          >
            {PRODUCT_DISCOUNT_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </select>

          {errors.discount && (
            <p className="mt-1 text-xs text-red-500">
              {
                errors
                  .discount
                  .message
              }
            </p>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-900">
            Duración de descuento
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="w-full max-w-[220px]">
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Fecha de inicio
              </label>

              <input
                {...register(
                  "discountStartsAt",
                )}
                type="date"
                disabled={
                  !applyDiscount
                }
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
              />

              {errors.discountStartsAt && (
                <p className="mt-1 text-xs text-red-500">
                  {
                    errors
                      .discountStartsAt
                      .message
                  }
                </p>
              )}
            </div>

            <div className="w-full max-w-[220px]">
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Fecha de fin
              </label>

              <input
                {...register(
                  "discountEndsAt",
                )}
                type="date"
                disabled={
                  !applyDiscount
                }
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
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
      </div>

      <div className="mt-7">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Descripción comercial
        </label>

        <textarea
          {...register(
            "description",
          )}
          rows={4}
          placeholder="Descripción del producto"
          className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#1C21D1] focus:ring-1 focus:ring-[#1C21D1]"
        />

        {errors.description && (
          <p className="mt-1 text-xs text-red-500">
            {
              errors
                .description
                .message
            }
          </p>
        )}
      </div>

      <div className="mt-7">
        <Controller
          name="tags"
          control={
            control
          }
          render={({
            field,
          }) => (
            <ProductTagsInput
              value={
                field.value
              }
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

      {applyDiscount &&
        previewPrice !==
          null && (
          <div className="mt-4 rounded-md bg-[#F2F5FC] px-4 py-3 text-sm">
            <span className="text-gray-500">
              Precio de vista previa:
            </span>

            <span className="ml-2 font-semibold text-[#1C21D1]">
              {new Intl.NumberFormat(
                "en-US",
                {
                  style:
                    "currency",

                  currency:
                    "USD",
                },
              ).format(
                previewPrice,
              )}
            </span>
          </div>
        )}

      <div className="mt-7">
        <ProductImagesField
          images={
            images
          }
          onFilesSelected={
            onFilesSelected
          }
          onRemoveImage={
            onRemoveImage
          }
          error={
            imageError ??
            errors
              .imageUrls
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
          {...register(
            "status",
          )}
          className={
            inputClass
          }
        >
          <option
            value=""
            disabled
            hidden
          >
            Estado de publicación
          </option>

          {PRODUCT_PUBLICATION_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>

        {errors.status && (
          <p className="mt-1 text-xs text-red-500">
            {
              errors
                .status
                .message
            }
          </p>
        )}
      </div>
    </section>
  );
}