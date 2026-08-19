"use client";

import {
  use,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ProductPreview,
} from "@/components/productos/ProductPreview";

import {
  ProductActions,
} from "@/components/productos/ProductActions";

import {
  ProductResultModal,
} from "@/components/productos/ProductResultModal";

import {
  useProduct,
} from "@/hooks/productos/useProduct";

import {
  useUpdateProductStatus,
} from "@/hooks/productos/useUpdateProductStatus";

import type {
  ProductUpdateStatus,
} from "@/types/productos";

interface ProductPreviewRouteProps {
  params: Promise<{
    id: string;
  }>;
}

interface ResultModalState {
  type:
    | "success"
    | "error";

  title: string;

  message: string;
}

export default function ProductPreviewRoute({
  params,
}: ProductPreviewRouteProps) {
  const router =
    useRouter();

  const {
    id,
  } = use(params);

  /**
   * Obtiene siempre el detalle real
   * y actualizado del producto.
   */
  const {
    product,
    isLoading,
    error,
    refetch,
  } = useProduct(id);

  /**
   * Hook encargado exclusivamente
   * del cambio de estado.
   */
  const {
    changeStatus,
    isLoading:
      isChangingStatus,
  } = useUpdateProductStatus();

  /**
   * Modal utilizado para informar
   * el resultado del cambio de estado.
   */
  const [
    resultModal,
    setResultModal,
  ] =
    useState<ResultModalState | null>(
      null,
    );

  /**
   * Ejecuta una transición de estado
   * utilizando el endpoint:
   *
   * PATCH /products/:id/status
   *
   * Backend continúa siendo la fuente
   * de verdad para validar la transición.
   */
 const handleChangeStatus =
  async (
    status: ProductUpdateStatus,
  ): Promise<void> => {
      if (
        !product ||
        isChangingStatus
      ) {
        return;
      }

      /**
       * Protección adicional en Frontend.
       *
       * Un producto DISCONTINUED no debe
       * volver a activarse.
       */
      if (
        product.status ===
          "DISCONTINUED" &&
        status === "ACTIVE"
      ) {
        setResultModal({
          type: "error",

          title:
            "Cambio de estado no permitido",

          message:
            "Un producto descontinuado no puede volver a publicarse.",
        });

        return;
      }

      const updatedProduct =
        await changeStatus(
          id,
          {
            status,
          },
        );

      /**
       * Si Backend rechazó la operación,
       * no modificamos localmente el
       * estado del producto.
       */
      if (!updatedProduct) {
        setResultModal({
          type: "error",

          title:
            "¡Algo salió mal!",

          message:
            "No se pudo cambiar el estado del producto. Verifica la transición e inténtalo nuevamente.",
        });

        /**
         * Volvemos a consultar Backend
         * para conservar la UI sincronizada.
         */
        refetch();

        return;
      }

      /**
       * Backend aceptó la transición.
       *
       * Volvemos a consultar el producto
       * para utilizar su estado definitivo.
       */
      refetch();

      let successMessage =
        "El estado del producto se actualizó correctamente.";

      if (
        status === "ACTIVE"
      ) {
        successMessage =
          "El producto fue publicado correctamente en el e-commerce.";
      }

      if (
        status === "PAUSED"
      ) {
        successMessage =
          "La publicación del producto fue pausada correctamente.";
      }

      if (
        status ===
        "DISCONTINUED"
      ) {
        successMessage =
          "El producto fue descontinuado correctamente.";
      }

      setResultModal({
        type: "success",

        title:
          "¡Estado actualizado!",

        message:
          successMessage,
      });
    };

  /**
   * Estado de carga inicial.
   */
  if (isLoading) {
    return (
      <main>
        <div className="rounded-xl border border-gray-300 bg-white p-8">
          <p className="text-sm text-gray-500">
            Cargando producto...
          </p>
        </div>
      </main>
    );
  }

  /**
   * Error al consultar el detalle.
   */
  if (error) {
    return (
      <main>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <p
            role="alert"
            className="text-sm text-red-600"
          >
            {error.message}
          </p>

          <button
            type="button"
            onClick={
              refetch
            }
            className="mt-4 rounded-md border border-[#1C21D1] px-4 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  /**
   * Producto inexistente.
   */
  if (!product) {
    return (
      <main>
        <div className="rounded-xl border border-gray-300 bg-white p-8">
          <p className="text-sm text-gray-500">
            No se encontró el producto.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/productos",
              )
            }
            className="mt-4 rounded-md border border-[#1C21D1] px-4 py-2 text-sm font-medium text-[#1C21D1] transition-colors hover:bg-indigo-50"
          >
            Volver al catálogo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/*
       * Vista previa utilizando
       * ProductDetail real.
       */}
      <ProductPreview
        product={
          product
        }
        onClose={() =>
          router.push(
            "/productos",
          )
        }
        onEdit={() =>
          router.push(
            `/productos/${id}/editar`,
          )
        }
      />

      {/*
       * Acciones disponibles según
       * el estado actual.
       *
       * DRAFT        → Publicar
       * ACTIVE       → Pausar
       * PAUSED       → Publicar
       * DISCONTINUED → No reactivar
       */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Estado de publicación
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Estado actual:{" "}
            <span className="font-medium text-gray-700">
              {product.status}
            </span>
          </p>
        </div>

        <ProductActions
          status={
            product.status
          }
          isLoading={
            isChangingStatus
          }
          onChangeStatus={
            handleChangeStatus
          }
        />
      </div>

      {/*
       * Resultado de la operación.
       */}
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
        onClose={() =>
          setResultModal(
            null,
          )
        }
      />
    </main>
  );
}