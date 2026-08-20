import type {
  InventoryWithDetailsDto,
} from "@/app/(erp)/inventario/types";

import type {
  InventoryProductView,
} from "./product-form.types";

export function mapInventoryToProductView(
  inventory: InventoryWithDetailsDto,
): InventoryProductView {
  return {
    inventoryId:
      inventory.id,

    name:
      inventory.productName,

    brand:
      inventory.brand,

    supplier:
      inventory.supplier?.name ??
      "Sin proveedor",

    category:
      inventory.category?.name ??
      "Sin categoría",

    inventoryStatus:
      inventory.status,

    totalStock:
      inventory.totalStock,

    variants:
      (inventory.details ?? []).map(
        (detail) => ({
          inventoryDetailId:
            detail.id,

          sku:
            detail.sku,

          size:
            detail.size,

          color:
            detail.color,

          stock:
            detail.stock,

          minStock:
            detail.minStock,

          stockStatus:
            detail.stockStatus,
        }),
      ),
  };
}
