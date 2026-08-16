"use client";

import {
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import { ProductInventoryPanel } from "./ProductInventoryPanel";
import { ProductManualFields } from "./ProductManualFields";

import { useInventorySelection } from "@/hooks/productos/useInventorySelection";

import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  InventoryProductView,
  ProductFormMode,
} from "@/types/productos/product-form.types";

import {
  MAX_PRODUCT_IMAGES,
  validateProductImage,
} from "@/types/productos/image-validation";

import type {
  ProductImagePreview,
} from "@/types/productos/product-image-form.types";

interface ProductFormProps {
  mode: ProductFormMode;

  /**
   * Inventario ya vinculado.
   * Se utiliza principalmente en edición.
   */
  inventory?:
    | InventoryProductView
    | null;

  defaultValues?:
    Partial<ProductFormInput>;

  onClose: () => void;

  onSubmit: (
    values: ProductFormSchema,
  ) => Promise<void> | void;

  /**
   * Búsqueda de inventario.
   * Será conectada posteriormente con
   * el service correspondiente.
   */
  searchInventory?: (
    search: string,
  ) => Promise<
    InventoryProductView[]
  >;
}

export function ProductForm({
  mode,
  inventory = null,
  defaultValues,
  onClose,
  onSubmit,
  searchInventory,
}: ProductFormProps) {
  /**
   * Imágenes seleccionadas localmente
   * para mostrar su preview.
   *
   * Todavía no contienen la URL final
   * entregada por Backend.
   */
  const [
    images,
    setImages,
  ] = useState<
    ProductImagePreview[]
  >([]);

  const [
    imageError,
    setImageError,
  ] = useState<
    string | null
  >(null);

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
  } = useForm<
    ProductFormInput,
    unknown,
    ProductFormSchema
  >({
    resolver: zodResolver(
      productFormSchema,
    ),

    mode: "onChange",

    defaultValues: {
      inventoryId:
        defaultValues
          ?.inventoryId ??
        "",

      commercialName:
        "",

      salePrice:
        "",

      applyDiscount:
        false,

      discount:
        "10",

      discountEndsAt:
        "",

      description:
        "",

      tags:
        [],

      imageUrls:
        [],

      status:
        "DRAFT",

      ...defaultValues,
    },
  });

  const {
    search:
      inventorySearch,

    results:
      inventoryResults,

    selectedInventory,

    isLoading:
      isSearchingInventory,

    error:
      inventorySearchError,

    hasSearched,

    setSearch:
      setInventorySearch,

    selectInventory,

  } = useInventorySelection({
    searchInventory,
  });

  /**
   * En edición utilizamos el inventario
   * que ya tiene vinculado el producto.
   *
   * En creación utilizamos el inventario
   * seleccionado desde la búsqueda.
   */
  const currentInventory =
    mode === "edit"
      ? inventory
      : selectedInventory;

  /**
   * Vincula el inventario seleccionado
   * con React Hook Form.
   */
  const handleSelectInventory = (
    selected: InventoryProductView,
  ): void => {
    /*
     * Validación defensiva.
     * Un inventario sin stock no puede
     * vincularse al producto.
     */
    if (
      selected.inventoryStatus ===
      "OUT_OF_STOCK"
    ) {
      return;
    }

    selectInventory(
      selected,
    );

    setValue(
      "inventoryId",
      selected.inventoryId,
      {
        shouldDirty:
          true,

        shouldValidate:
          true,
      },
    );
  };

  /**
   * Valida y prepara múltiples imágenes
   * seleccionadas desde el equipo.
   */
  const handleFilesSelected = (
    files: File[],
  ): void => {
    setImageError(
      null,
    );

    const availableSlots =
      MAX_PRODUCT_IMAGES -
      images.length;

    if (
      availableSlots <= 0
    ) {
      setImageError(
        `Se permite un máximo de ${MAX_PRODUCT_IMAGES} imágenes.`,
      );

      return;
    }

    if (
      files.length >
      availableSlots
    ) {
      setImageError(
        `Solo puedes agregar ${availableSlots} ${
          availableSlots === 1
            ? "imagen"
            : "imágenes"
        } más.`,
      );

      return;
    }

    const newImages:
      ProductImagePreview[] =
        [];

    for (
      const file of files
    ) {
      const validation =
        validateProductImage(
          file,
        );

      if (
        !validation.valid
      ) {
        /*
         * Si alguna imagen no es válida,
         * liberamos las URLs creadas
         * anteriormente en esta misma
         * selección.
         */
        newImages.forEach(
          (image) => {
            if (
              image.previewUrl.startsWith(
                "blob:",
              )
            ) {
              URL.revokeObjectURL(
                image.previewUrl,
              );
            }
          },
        );

        setImageError(
          validation.message ??
            "La imagen seleccionada no es válida.",
        );

        return;
      }

      newImages.push({
        id:
          crypto.randomUUID(),

        file,

        previewUrl:
          URL.createObjectURL(
            file,
          ),
      });
    }

    setImages(
      (current) => [
        ...current,
        ...newImages,
      ],
    );
  };

  /**
   * Elimina una imagen del preview.
   */
  const handleRemoveImage = (
    id: string,
  ): void => {
    setImages(
      (current) => {
        const image =
          current.find(
            (item) =>
              item.id ===
              id,
          );

        if (
          image?.previewUrl.startsWith(
            "blob:",
          )
        ) {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        }

        return current.filter(
          (item) =>
            item.id !==
            id,
        );
      },
    );

    setImageError(
      null,
    );
  };

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit,
      )}
      noValidate
    >
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <ProductInventoryPanel
            mode={
              mode
            }
            inventory={
              currentInventory
            }
            inventorySearch={
              inventorySearch
            }
            onInventorySearchChange={
              setInventorySearch
            }
            searchResults={
              inventoryResults
            }
            isSearching={
              isSearchingInventory
            }
            searchError={
              inventorySearchError
            }
            hasSearched={
              hasSearched
            }
            onSelectInventory={
              handleSelectInventory
            }
            error={
              errors
                .inventoryId
                ?.message
            }
          />

          <ProductManualFields
            register={
              register
            }
            control={
              control
            }
            errors={
              errors
            }
            watch={
              watch
            }
            setValue={
              setValue
            }

            images={
              images
            }

            imageError={
              imageError
            }

            onFilesSelected={
              handleFilesSelected
            }

            onRemoveImage={
              handleRemoveImage
            }
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSubmitting
            }
            className="min-w-32 rounded-md border border-[#1C21D1] px-6 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting
            }
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