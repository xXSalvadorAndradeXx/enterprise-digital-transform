"use client";

import {
  use,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";

import {
  useProduct,
} from "@/hooks/productos/useProduct";

import type {
  ProductFormInput,
  ProductFormSchema,
} from "@/types/productos/schemas";

interface EditarProductoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarProductoPage({
  params,
}: EditarProductoPageProps) {
  const router =
    useRouter();

  const {
    id,
  } = use(params);

  /*
   * Obtiene el producto real desde Backend.
   */
  const {
    product,
    isLoading,
    error,
    refetch,
  } = useProduct(id);

  /*
   * Estado de carga.
   */
  if (isLoading) {
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

  /*
   * Error al consultar el producto.
   */
  if (error) {
    return (
      <main>
        <h1 className="mb-5 text-xl font-semibold text-gray-900">
          Editar producto
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {error.message ??
              "No se pudo cargar el producto."}
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

  /*
   * El producto no existe.
   */
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

  /*
   * Precarga de los valores actuales.
   *
   * FE-PROD-13:
   * Si discount > 0, el checkbox se
   * mostrará activo y se cargarán el
   * porcentaje y la fecha final.
   */
  const defaultValues:
    Partial<ProductFormInput> = {
      commercialName:
        product.commercialName,

      salePrice:
        String(
          product.salePrice,
        ),

      applyDiscount:
        product.discount > 0,

      discount:
        product.discount > 0
          ? String(
              product.discount,
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

      /*
       * Durante edición mantenemos
       * el estado actual compatible
       * con el formulario.
       */
      status:
        product.status ===
        "ACTIVE"
          ? "ACTIVE"
          : "DRAFT",
    };

  const handleSubmit = async (
    _values: ProductFormSchema,
    _files: File[],
  ): Promise<void> => {
    /*
     * En el siguiente paso conectaremos
     * estos valores con useUpdateProduct.
     *
     * FE-PROD-13 también hará aquí la
     * confirmación previa si existe
     * descuento.
     */
  };

  return (
    <main>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Editar producto
      </h1>

      <ProductForm
        mode="edit"
        defaultValues={
          defaultValues
        }
        onClose={() =>
          router.back()
        }
        onSubmit={
          handleSubmit
        }
      />
    </main>
  );
}