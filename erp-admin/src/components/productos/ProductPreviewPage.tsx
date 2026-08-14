"use client";

import { useRouter } from "next/navigation";

import { ProductPreview } from "./ProductPreview";

import type {
  ProductPreviewData,
} from "@/types/productos";

interface ProductPreviewPageProps {
  product: ProductPreviewData;
}

export function ProductPreviewPage({
  product,
}: ProductPreviewPageProps) {
  const router = useRouter();

  const handleClose = (): void => {
    router.back();
  };

  const handleEdit = (): void => {
    router.push(
      `/productos/${product.id}/editar`,
    );
  };

  return (
    <main>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">
        Vista previa del producto
      </h1>

      <ProductPreview
        product={product}
        onClose={handleClose}
        onEdit={handleEdit}
      />
    </main>
  );
}