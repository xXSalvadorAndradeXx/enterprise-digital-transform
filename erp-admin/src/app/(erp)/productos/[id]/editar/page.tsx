"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/productos/ProductForm";

import type {
  ProductFormSchema,
} from "@/types/productos/schemas";

export default function EditarProductoPage() {
  const router = useRouter();

  const handleSubmit = async (
    _values: ProductFormSchema,
  ): Promise<void> => {
    /*
     * La actualización real se conectará mediante
     * service + MSW siguiendo UpdateProductDto.
     */
  };

  return (
    <main>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Editar producto
      </h1>

      <ProductForm
        mode="edit"
        onClose={() =>
          router.back()
        }
        onSubmit={handleSubmit}
      />
    </main>
  );
}