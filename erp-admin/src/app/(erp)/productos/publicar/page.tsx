"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

export default function PublicarProductoPage() {
  const router = useRouter();

  const handleSubmit = async (
    _values: ProductFormSchema,
  ): Promise<void> => {
    /*
     * La creación real se conectará mediante
     * service + MSW siguiendo CreateProductDto.
     */
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
        onSubmit={handleSubmit}
        onInventorySearch={() => {
          /*
           * Se conectará con Inventario
           * en la tarea correspondiente.
           */
        }}
      />
    </main>
  );
}