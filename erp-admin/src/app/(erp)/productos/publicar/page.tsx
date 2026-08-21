"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";
import { ConfirmDiscountModal } from "@/components/productos/ConfirmDiscountModal";
import { ProductResultModal } from "@/components/productos/ProductResultModal";

import { useCreateProduct } from "@/hooks/productos/useCreateProduct";
import { useUploadProductImages } from "@/hooks/productos/useUploadProductImages";

import {
  isProductHttpError,
} from "@/services/productos/product-errors";

import {
  mapProductFormToCreateRequest,
} from "@/types/productos/product-form.mapper";

import {
  calculateProductPreviewPrice,
} from "@/utils/calculateProductPreviewPrice";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  PendingProductSubmission,
} from "@/types/productos/product-confirmation.types";


export default function PublicarProductoPage() {
  const router =
    useRouter();

  const {
    create,
    isLoading:
      isCreating,
    error:
      createError,
  } =
    useCreateProduct();

  const {
    uploadImages,
    isUploading,
    error:
      uploadError,
  } =
    useUploadProductImages();

  const [
    pendingSubmission,
    setPendingSubmission,
  ] =
    useState<PendingProductSubmission | null>(
      null,
    );

  const [
    resultModal,
    setResultModal,
  ] = useState<{
    type:
      | "success"
      | "error";

    title: string;

    message: string;

    retryable?: boolean;
  } | null>(
    null,
  );

  const isProcessing =
    isCreating ||
    isUploading;

  const executeCreation =
    async (
      submission:
        PendingProductSubmission,
    ): Promise<void> => {
      const {
        values,
        files,
      } = submission;

      const imageUrls =
        await uploadImages(
          files,
        );

      if (
        imageUrls === null
      ) {
        setResultModal({
          type: "error",
          title:
            "¡Algo salió mal!",
          message:
            uploadError?.message ??
            "No pudimos subir las imágenes. Por favor, inténtalo nuevamente.",
        });

        return;
      }

      const request =
        mapProductFormToCreateRequest(
          values,
          {
            imageUrls,
          },
        );

      let product;

      try {
        product =
          await create(
            request,
          );
      } catch (caughtError) {
        const isInventoryConflict =
          isProductHttpError(
            caughtError,
          ) &&
          caughtError.status === 409 &&
          caughtError.message
            .toLowerCase()
            .includes(
              "ya se encuentra asociado",
            );

        setResultModal(
          isInventoryConflict
            ? {
                type: "error",
                title:
                  "Producto ya registrado",
                message:
                  "Este producto ya se encuentra registrado en el catálogo. Selecciona otro producto del inventario.",
                retryable: false,
              }
            : {
                type: "error",
                title:
                  "¡Algo salió mal!",
                message:
                  isProductHttpError(
                    caughtError,
                  )
                    ? caughtError.message
                    : "No pudimos completar tu solicitud. Por favor, inténtalo nuevamente.",
                retryable: true,
              },
        );

        return;
      }

      if (!product) {
        setResultModal({
          type: "error",
          title:
            "¡Algo salió mal!",
          message:
            createError?.message ??
            "No pudimos completar tu solicitud. Por favor, inténtalo nuevamente.",
        });

        return;
      }

      
      if (
        product.status ===
        "ACTIVE"
      ) {
        setResultModal({
          type: "success",
          title:
            "¡Producto publicado!",
          message:
            `El producto "${product.commercialName}" ha sido publicado con éxito y ya está visible para los clientes.`,
        });
      } else {
        setResultModal({
          type: "success",
          title:
            "¡Cambios guardados con éxito!",
          message:
            "El producto se ha actualizado correctamente en el catálogo y los cambios ya están reflejados en el sistema.",
        });
      }

      setPendingSubmission(
        null,
      );
    };

  const handleSubmit =
    async (
      values:
        ProductFormSchema,
      files:
        File[],
    ): Promise<void> => {
      const submission:
        PendingProductSubmission =
        {
          values,
          files,
        };

      /*
       * Si el descuento está activo,
       * NO guardamos todavía.
       */
      if (
        values.applyDiscount
      ) {
        setPendingSubmission(
          submission,
        );

        return;
      }

      /*
       * Sin descuento podemos ejecutar
       * directamente.
       */
      await executeCreation(
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

      await executeCreation(
        pendingSubmission,
      );
    };

  const discount =
    pendingSubmission
      ? Number(
          pendingSubmission
            .values.discount,
        )
      : 0;

  const originalPrice =
    pendingSubmission
      ? Number(
          pendingSubmission
            .values.salePrice,
        )
      : 0;

  const previewPrice =
    pendingSubmission
      ? calculateProductPreviewPrice(
          pendingSubmission
            .values.salePrice,
          pendingSubmission
            .values.discount,
          true,
        ) ?? originalPrice
      : 0;

  const discountAmount =
    Math.max(
      0,
      originalPrice -
        previewPrice,
    );



  return (
    <main>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Añadir producto
      </h1>

      <ProductForm
        mode="create"
        onClose={() =>
          router.push(
            "/productos",
          )
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
          resultModal?.message ??
          ""
        }
        onClose={() => {
          const wasSuccess =
            resultModal?.type ===
            "success";

          setResultModal(
            null,
          );

          if (wasSuccess) {
            router.push(
              "/productos",
            );
          }
        }}
        onRetry={() => {
          setResultModal(
            null,
          );
        }}
        errorActionLabel={
          resultModal?.retryable ===
          false
            ? "Aceptar"
            : "Reintentar"
        }
      />
    </main>
  );
}
