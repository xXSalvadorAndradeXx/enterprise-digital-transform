"use client";

import { useState } from "react";
import {
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ProductInventoryPanel } from "./ProductInventoryPanel";
import { ProductManualFields } from "./ProductManualFields";

import {
  productFormSchema,
  type ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  InventoryProductView,
  ProductFormMode,
} from "@/types/productos/product-form.types";

interface ProductFormProps {
  mode: ProductFormMode;

  inventory?: InventoryProductView | null;

  defaultValues?: Partial<ProductFormSchema>;

  onClose: () => void;

  onSubmit: (
    values: ProductFormSchema,
  ) => Promise<void> | void;

  onInventorySearch?: (
    search: string,
  ) => void;

  onAddImages?: () => void;
}

export function ProductForm({
  mode,
  inventory = null,
  defaultValues,
  onClose,
  onSubmit,
  onInventorySearch,
  onAddImages,
}: ProductFormProps) {
  const [
    inventorySearch,
    setInventorySearch,
  ] = useState("");

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(
      productFormSchema,
    ),
    mode: "onChange",

    defaultValues: {
      commercialName: "",
      salePrice: "",

      applyDiscount: false,
      discount: "10",
      discountEndsAt: "",

      description: "",

      tags: [],
      imageUrls: [],

      status: "DRAFT",

      ...defaultValues,
    },
  });

  const handleInventorySearch =
    (): void => {
      onInventorySearch?.(
        inventorySearch.trim(),
      );
    };

  const handleRemoveImage = (
    index: number,
  ): void => {
    const images =
      watch("imageUrls");

    setValue(
      "imageUrls",
      images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit,
      )}
    >
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <ProductInventoryPanel
            mode={mode}
            inventory={inventory}
            inventorySearch={
              inventorySearch
            }
            onInventorySearchChange={
              setInventorySearch
            }
            onSearch={
              handleInventorySearch
            }
          />

          <ProductManualFields
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            onAddImages={() =>
              onAddImages?.()
            }
            onRemoveImage={
              handleRemoveImage
            }
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-32 rounded-md border border-[#1C21D1] px-6 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-w-32 rounded-md bg-[#1C21D1] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Guardando..."
              : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}