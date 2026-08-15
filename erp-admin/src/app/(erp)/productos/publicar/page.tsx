"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

import type {
  InventoryProductView,
} from "@/types/productos/product-form.types";

export default function PublicarProductoPage() {
  const router =
    useRouter();

  const handleSubmit = async (
    _values: ProductFormSchema,
  ): Promise<void> => {
    /*
     * La creación real se conectará
     * mediante service + MSW.
     */
  };

  const handleSearchInventory =
    async (
      _search: string,
    ): Promise<
      InventoryProductView[]
    > => {
      /*
       * FE-PROD-08:
       *
       * Aquí se conectará el endpoint
       * real del módulo Inventario.
       *
       * No agregamos datos mock
       * tradicionales.
       */
      return [];
    };

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
        searchInventory={
          handleSearchInventory
        }
      />
    </main>
  );
}