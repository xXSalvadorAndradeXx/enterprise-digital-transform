"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";
import { ConfirmDiscountModal } from "@/components/productos/ConfirmDiscountModal";
import { ProductResultModal } from "@/components/productos/ProductResultModal";

import {
  useProduct,
} from "@/hooks/productos/useProduct";

import {
  useUpdateProduct,
} from "@/hooks/productos/useUpdateProduct";

import {
  useUpdateProductStatus,
} from "@/hooks/productos/useUpdateProductStatus";

import {
  useUploadProductImages,
} from "@/hooks/productos/useUploadProductImages";

import {
  getInventoryById,
} from "@/app/(erp)/inventario/services/inventory.service";

import {
  mapInventoryToProductView,
} from "@/types/productos/inventory-product.mapper";

import {
  mapProductFormToUpdateRequest,
} from "@/types/productos/product-form.mapper";

import type {
  ProductFormInput,
  ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

import type {
  ProductVariantConfig,
} from "@/types/productos/product-variant.types";

interface EditarProductoPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PendingSubmission {
  values: ProductFormSchema;
  files: File[];
  variantConfigs: ProductVariantConfig[];
}

interface ResultModalState {
  type:
    | "success"
    | "error";

  title: string;

  message: string;
}

export default function EditarProductoPage({
  params,
}: EditarProductoPageProps) {
  const router =
    useRouter();

  const {
    id,
  } = use(params);

  const {
    product,
    isLoading:
      isLoadingProduct,
    error:
      productError,
    refetch,
  } = useProduct(id);

  const {
    update,
    isLoading:
      isUpdating,
    error:
      updateError,
  } = useUpdateProduct();

  const {
    changeStatus,
    isLoading:
      isChangingStatus,
    error:
      statusError,
  } = useUpdateProductStatus();

  const {
    uploadImages,
    isUploading,
    error:
      uploadError,
  } =
    useUploadProductImages();

  const [
    inventoryView,
    setInventoryView,
  ] =
    useState<InventoryProductView | null>(
      null,
    );

  const [
    isLoadingInventory,
    setIsLoadingInventory,
  ] =
    useState(false);

  const [
    inventoryError,
    setInventoryError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    pendingSubmission,
    setPendingSubmission,
  ] =
    useState<PendingSubmission | null>(
      null,
    );

  const [
    lastSubmission,
    setLastSubmission,
  ] =
    useState<PendingSubmission | null>(
      null,
    );

  const [
    resultModal,
    setResultModal,
  ] =
    useState<ResultModalState | null>(
      null,
    );

  /*
   * Carga el inventario completo para
   * mostrar la columna izquierda en edición.
   */
  useEffect(() => {
    const inventoryId =
      product?.inventory?.id;

    if (!inventoryId) {
      return;
    }

    let cancelled =
      false;

    const loadInventory =
      async (): Promise<void> => {
        setIsLoadingInventory(
          true,
        );

        setInventoryError(
          null,
        );

        try {
          const response =
            await getInventoryById(
              inventoryId,
            );

          if (cancelled) {
            return;
          }

          setInventoryView(
            mapInventoryToProductView(
              response.data,
            ),
          );
        } catch (
          caughtError
        ) {
          if (cancelled) {
            return;
          }

          setInventoryError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "No se pudo cargar el inventario vinculado.",
          );
        } finally {
          if (!cancelled) {
            setIsLoadingInventory(
              false,
            );
          }
        }
      };

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, [
    product?.inventory?.id,
  ]);

  const isProcessing =
    isUpdating ||
    isUploading ||
    isChangingStatus;

  /*
   * Prepara los valores actuales
   * del producto para edición.
   */
const defaultValues =
  useMemo<
    Partial<ProductFormInput>
  >(() => {
    if (!product) {
      return {};
    }

    const hasDiscount =
      product.discount !==
        null &&
      product.discount > 0;

    return {
      inventoryId:
        product.inventory?.id ??
        "",

      commercialName:
        product.commercialName,

      salePrice:
        String(
          product.salePrice,
        ),

      applyDiscount:
        hasDiscount,

      discount:
        hasDiscount
          ? String(
              product.discount,
            )
          : "",

      discountStartsAt:
        product.discountStartsAt
          ? product.discountStartsAt.slice(
              0,
              10,
            )
          : "",

      discountEndsAt:
        product.discountEndsAt
          ? product.discountEndsAt.slice(
              0,
              10,
            )
          : "",

      description:
        product.description ??
        "",

      tags:
        product.tags,

      imageUrls:
        product.images.map(
          (image) =>
            image.imageUrl,
        ),

      status:
        product.status ===
        "ACTIVE"
          ? "ACTIVE"
          : "DRAFT",
    };
  }, [
    product,
  ]);

  /*
   * Ejecuta realmente:
   *
   * upload de imágenes nuevas
   * +
   * PATCH /products/:id
   */
  const executeUpdate =
    async (
      submission:
        PendingSubmission,
    ): Promise<void> => {
      if (isProcessing) {
        return;
      }

      setLastSubmission(
        submission,
      );

      const {
        values,
        files,
        variantConfigs,
      } = submission;

      /*
       * Solo se suben los archivos
       * agregados durante esta edición.
       *
       * values.imageUrls conserva
       * las imágenes existentes.
       */
      const uploadedUrls =
        await uploadImages(
          files,
        );

      if (
        uploadedUrls === null
      ) {
        setResultModal({
          type: "error",

          title:
            "¡Algo salió mal!",

          message:
            "No se pudieron subir las imágenes.",
        });

        return;
      }

      const finalImageUrls = [
        ...values.imageUrls,
        ...uploadedUrls,
      ];

      const request =
        mapProductFormToUpdateRequest(
          values,
          {
            imageUrls:
              finalImageUrls,
            variantConfigs,
          },
        );

      const updatedProduct =
        await update(
          id,
          request,
        );

      if (!updatedProduct) {
        setResultModal({
          type: "error",

          title:
            "¡Algo salió mal!",

          message:
            "No pudimos completar la actualización. Por favor, inténtalo nuevamente.",
        });

        return;
      }

      const shouldPublish =
        values.status ===
          "ACTIVE" &&
        updatedProduct.status !==
          "ACTIVE";

      if (shouldPublish) {
        const publishedProduct =
          await changeStatus(
            id,
            {
              status: "ACTIVE",
            },
          );

        if (!publishedProduct) {
          setResultModal({
            type: "error",
            title:
              "No se pudo publicar",
            message:
              statusError?.message ??
              "Los cambios se guardaron, pero no fue posible publicar el producto. Inténtalo nuevamente.",
          });

          return;
        }
      }

      setPendingSubmission(
        null,
      );

      setResultModal(
        shouldPublish
          ? {
              type: "success",
              title:
                "¡Estado actualizado!",
              message:
                "El producto fue publicado correctamente en el e-commerce.",
            }
          : {
              type: "success",
              title:
                "¡Cambios guardados con éxito!",
              message:
                "El producto se ha actualizado correctamente en el catálogo y los cambios ya están reflejados en el sistema.",
            },
      );
    };

  /*
   * ProductForm ya llega aquí después
   * de validar React Hook Form + Zod.
   */
  const handleSubmit =
    async (
      values:
        ProductFormSchema,

      files:
        File[],
      variantConfigs:
        ProductVariantConfig[],
    ): Promise<void> => {
      const submission:
        PendingSubmission = {
          values,
          files,
          variantConfigs,
        };

      setLastSubmission(
        submission,
      );

      /*
       * FE-PROD-13:
       * Ningún descuento se guarda
       * sin confirmación.
       */
      if (
        values.applyDiscount
      ) {
        setPendingSubmission(
          submission,
        );

        return;
      }

      await executeUpdate(
        submission,
      );
    };

  const handleConfirmDiscount =
    async (): Promise<void> => {
      if (
        !pendingSubmission
      ) {
        return;
      }

      await executeUpdate(
        pendingSubmission,
      );
    };

  /*
   * El cálculo siguiente es EXCLUSIVAMENTE
   * una vista previa para el modal.
   */
  const originalPrice =
    pendingSubmission
      ? Number(
          pendingSubmission
            .values.salePrice,
        )
      : 0;

  const discount =
    pendingSubmission
      ? Number(
          pendingSubmission
            .values.discount,
        )
      : 0;

  const discountAmount =
    Number.isFinite(
      originalPrice,
    ) &&
    Number.isFinite(
      discount,
    )
      ? originalPrice *
        (discount / 100)
      : 0;

  const previewPrice =
    Math.max(
      0,
      originalPrice -
        discountAmount,
    );

  const displayErrorMessage =
    updateError?.message ??
    statusError?.message ??
    uploadError?.message ??
    resultModal?.message ??
    "";

  if (
    isLoadingProduct ||
    isLoadingInventory
  ) {
    return (
      <main>
        <h1 className="mb-5 text-xl font-semibold text-gray-900">
          Editar producto
        </h1>

        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-sm text-gray-500">
            Cargando producto...
          </p>
        </div>
      </main>
    );
  }

  if (productError) {
    return (
      <main>
        <h1 className="mb-5 text-xl font-semibold text-gray-900">
          Editar producto
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {productError.message}
          </p>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 rounded-md border border-[#1C21D1] px-4 py-2 text-sm font-medium text-[#1C21D1]"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  if (
    inventoryError
  ) {
    return (
      <main>
        <h1 className="mb-5 text-xl font-semibold text-gray-900">
          Editar producto
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {inventoryError}
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <h1 className="mb-5 text-xl font-semibold text-gray-900">
          Editar producto
        </h1>

        <div className="rounded-xl border border-gray-300 bg-white p-6">
          <p className="text-sm text-gray-500">
            No se encontró el producto.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Editar producto
      </h1>

      <ProductForm
        mode="edit"
        inventory={
          inventoryView
        }
        defaultValues={
          defaultValues
        }
        onClose={() =>
          router.back()
        }
        onSubmit={
          handleSubmit
        }
        isProcessing={
          isProcessing
        }
      />

      <ConfirmDiscountModal
        isOpen={
          pendingSubmission !==
          null
        }
        discount={
          discount
        }
        originalPrice={
          originalPrice
        }
        discountAmount={
          discountAmount
        }
        previewPrice={
          previewPrice
        }
        isLoading={
          isProcessing
        }
        onCancel={() =>
          setPendingSubmission(
            null,
          )
        }
        onConfirm={
          handleConfirmDiscount
        }
      />

      <ProductResultModal
        isOpen={
          resultModal !==
          null
        }
        type={
          resultModal?.type ??
          "success"
        }
        title={
          resultModal?.title ??
          ""
        }
        message={
          resultModal?.type ===
          "error"
            ? displayErrorMessage
            : resultModal?.message ??
              ""
        }
        onClose={() => {
          const wasSuccessful =
            resultModal?.type ===
            "success";

          setResultModal(
            null,
          );

          if (
            wasSuccessful
          ) {
            router.push(
              "/productos",
            );
          }
        }}
        onRetry={() => {
          setResultModal(
            null,
          );

          if (
            lastSubmission
          ) {
            void executeUpdate(
              lastSubmission,
            );
          }
        }}
      />
    </main>
  );
}
