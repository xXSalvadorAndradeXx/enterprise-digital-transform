"use client";

import {
  useState,
} from "react";

import {
  useForm,
  useWatch,
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
    files: File[],
  ) => Promise<void> | void;

  /**
   * Indica si existe un proceso externo
   * de creación o actualización activo.
   */
  isProcessing?: boolean;
}

export function ProductForm({
  mode,
  inventory = null,
  defaultValues,
  onClose,
  onSubmit,
  isProcessing = false,
}: ProductFormProps) {
  /**
   * Imágenes seleccionadas localmente
   * para mostrar su preview.
   *
   * En edición también incluye imágenes
   * existentes provenientes de Backend.
   */
  const [
    images,
    setImages,
  ] = useState<
    ProductImagePreview[]
  >(() =>
    (
      defaultValues?.imageUrls ??
      []
    ).map(
      (
        imageUrl,
        index,
      ) => ({
        id:
          `existing-${index}`,

        previewUrl:
          imageUrl,

        file:
          undefined,
      }),
    ),
  );

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

      discountStartsAt:
        "",

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

  /**
   * Observamos únicamente imageUrls.
   *
   * useWatch evita utilizar
   * watch("imageUrls") directamente
   * dentro de handlers.
   */
  const currentImageUrls =
    useWatch({
      control,
      name: "imageUrls",
    }) ?? [];

  const formIsBusy =
    isSubmitting ||
    isProcessing;

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
  } = useInventorySelection();

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
  const handleSelectInventory =
    async (
      selected:
        InventoryProductView,
    ): Promise<void> => {
      if (
        selected.inventoryStatus ===
        "OUT_OF_STOCK"
      ) {
        return;
      }

      const wasSelected =
        await selectInventory(
          selected.inventoryId,
        );

      if (!wasSelected) {
        return;
      }

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
        /**
         * Si alguna imagen no es válida,
         * liberamos las URLs creadas
         * anteriormente en esta selección.
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
   *
   * Si es una imagen existente,
   * también se elimina de imageUrls.
   *
   * Si es una imagen local,
   * solamente se elimina el preview/File.
   */
  const handleRemoveImage = (
    id: string,
  ): void => {
    const imageToRemove =
      images.find(
        (image) =>
          image.id === id,
      );

    if (!imageToRemove) {
      return;
    }

    if (
      imageToRemove.previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        imageToRemove.previewUrl,
      );
    } else {
      setValue(
        "imageUrls",
        currentImageUrls.filter(
          (url) =>
            url !==
            imageToRemove.previewUrl,
        ),
        {
          shouldDirty:
            true,

          shouldValidate:
            true,
        },
      );
    }

    setImages(
      (current) =>
        current.filter(
          (image) =>
            image.id !== id,
        ),
    );

    setImageError(
      null,
    );
  };

  /**
   * Envía únicamente los File nuevos.
   *
   * Las imágenes existentes permanecen
   * dentro de values.imageUrls.
   */
  const handleValidatedSubmit =
    async (
      values:
        ProductFormSchema,
    ): Promise<void> => {
      if (
        images.length === 0
      ) {
        setImageError(
          "Debes agregar al menos una imagen del producto.",
        );

        return;
      }

      setImageError(
        null,
      );

      const files =
        images
          .map(
            (image) =>
              image.file,
          )
          .filter(
            (
              file,
            ): file is File =>
              file !==
              undefined,
          );

      await onSubmit(
        values,
        files,
      );
    };

  return (
    <form
      onSubmit={handleSubmit(
        handleValidatedSubmit,
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
              formIsBusy
            }
            className="min-w-32 rounded-md border border-[#1C21D1] px-6 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>

          <button
            type="submit"
            disabled={
              formIsBusy
            }
            className="min-w-32 rounded-md bg-[#1C21D1] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#171AAD] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formIsBusy
              ? "Guardando..."
              : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
