"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";

import {
  useCreateProduct,
} from "@/hooks/productos/useCreateProduct";

import {
  useUploadProductImages,
} from "@/hooks/productos/useUploadProductImages";

import {
  mapProductFormToCreateRequest,
} from "@/types/productos/product-form.mapper";

import {
  getCreateProductErrorMessage,
} from "@/services/productos/product-create-error";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

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
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );

  const isSubmitting =
    isCreating ||
    isUploading;

  const handleSubmit = async (
    values:
      ProductFormSchema,
    files:
      File[],
  ): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    setSuccessMessage(
      null,
    );

    setLocalError(
      null,
    );

    /*
     * 1. Subir imágenes.
     */
    const imageUrls =
      await uploadImages(
        files,
      );

    if (
      imageUrls === null
    ) {
      return;
    }

    /*
     * 2. Convertir formulario al
     * CreateProductRequest.
     */
    const request =
      mapProductFormToCreateRequest(
        values,
        {
          imageUrls,
        },
      );

    /*
     * 3. Crear producto.
     */
    const createdProduct =
      await create(
        request,
      );

    if (!createdProduct) {
      return;
    }

    /*
     * 4. Mensaje diferenciado.
     */
    if (
      createdProduct.status ===
      "ACTIVE"
    ) {
      setSuccessMessage(
        "¡Producto publicado!",
      );
    } else {
      setSuccessMessage(
        "Producto guardado como borrador.",
      );
    }

    /*
     * Al navegar al catálogo,
     * useProducts vuelve a ejecutar
     * GET /products al montarse.
     */
    window.setTimeout(
      () => {
        router.push(
          "/productos",
        );
      },
      800,
    );
  };

  const displayError =
    localError ??
    (
      createError
        ? getCreateProductErrorMessage(
            createError,
          )
        : null
    ) ??
    uploadError?.message ??
    null;

  /**
   * FE-PROD-08:
   * La consulta real de Inventario
   * se conectará cuando el módulo
   * correspondiente exponga su service.
   */
  const searchInventory =
    async (
      _search: string,
    ): Promise<
      InventoryProductView[]
    > => {
      return [];
    };

  return (
    <main>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Añadir producto
      </h1>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          {successMessage}
        </div>
      )}

      {displayError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {displayError}
        </div>
      )}

      <ProductForm
        mode="create"
        onClose={() =>
          router.push("/productos")
        }
        onSubmit={handleSubmit}
        searchInventory={searchInventory}
        isProcessing={isSubmitting}
      />
    </main>
  );
}