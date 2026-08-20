"use client";

import {
  use,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ProductPreview,
} from "@/components/productos/ProductPreview";

import {
  useProduct,
} from "@/hooks/productos/useProduct";

interface ProductPreviewRouteProps {
  params: Promise<{
    id: string;
  }>;
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

    </main>
  );
}
