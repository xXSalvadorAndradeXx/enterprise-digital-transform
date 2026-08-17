import type { PurchaseResponse, RestockPreviewResponse } from "@/app/(erp)/compras/types/purchases.types";

export const mockPurchaseSuppliers = [
  { id: "70000000-0000-4000-8000-000000000001", name: "Nike", phone: "74567890" },
  { id: "10000000-0000-4000-8000-000000000001", name: "Textiles Centroamericanos", phone: "71234567" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Distribuidora Moda SV", phone: "72345678" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Calzado del Pacífico", phone: "73456789" },
] as const;

export const mockRestockInventories: RestockPreviewResponse[] = [
  {
    inventory: { id: "11111111-1111-4111-8111-111111111111", productName: "Raw Black T-Shirt", brand: "Raw", category: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Moda" } },
    details: [
      { inventoryDetailId: "21111111-1111-4111-8111-111111111111", sku: "RAW-BLACK-S", size: "S", color: "#000000", currentStock: 35, currentUnitCost: 5 },
      { inventoryDetailId: "22111111-1111-4111-8111-111111111111", sku: "RAW-BLACK-M", size: "M", color: "#000000", currentStock: 12, currentUnitCost: 5 },
      { inventoryDetailId: "23111111-1111-4111-8111-111111111111", sku: "RAW-BLACK-L", size: "L", color: "#000000", currentStock: 28, currentUnitCost: 5 },
    ],
  },
  {
    inventory: { id: "33333333-3333-4333-8333-333333333333", productName: "Camisa blanca", brand: "Woden", category: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Moda" } },
    details: [
      { inventoryDetailId: "31111111-1111-4111-8111-111111111111", sku: "CAM-BLANCA-S", size: "S", color: "#FFFFFF", currentStock: 14, currentUnitCost: 7.5 },
      { inventoryDetailId: "32111111-1111-4111-8111-111111111111", sku: "CAM-BLANCA-M", size: "M", color: "#FFFFFF", currentStock: 20, currentUnitCost: 7.5 },
    ],
  },
];

export const mockPurchases: PurchaseResponse[] = [
  {
    id: "50000000-0000-4000-8000-000000000001", reference: "CP-0001", type: "NUEVO_PRODUCTO", productName: "Nike Ford", purchaseDate: "2026-05-18", totalAmount: 309.5, totalQuantity: 100, invoiceUrl: "https://mock.erp.local/invoices/factura-001.pdf", status: "COMPLETED",
    supplier: { id: "70000000-0000-4000-8000-000000000001", name: "Nike" }, items: [{ id: "51000000-0000-4000-8000-000000000001", sku: "NIKE-FORD-001", size: "M", color: "#000000", quantity: 100, unitCost: 3.095, subtotal: 309.5 }],
    createdBy: { id: "90000000-0000-4000-8000-000000000001", firstName: "Admin", lastName: "ERP" }, createdAt: "2026-05-18T12:00:00.000Z", deletedAt: null,
  },
  {
    id: "50000000-0000-4000-8000-000000000002", reference: "CP-0002", type: "REABASTECIMIENTO", productName: "Nike Low 1", purchaseDate: "2026-05-18", totalAmount: 105.5, totalQuantity: 90, invoiceUrl: "https://mock.erp.local/invoices/factura-002.pdf", status: "COMPLETED",
    supplier: { id: "70000000-0000-4000-8000-000000000001", name: "Nike" }, items: [{ id: "51000000-0000-4000-8000-000000000002", sku: "NIKE-LOW-001", size: "38", color: "#FFFFFF", quantity: 90, unitCost: 1.1722, subtotal: 105.5 }],
    createdBy: { id: "90000000-0000-4000-8000-000000000001", firstName: "Admin", lastName: "ERP" }, createdAt: "2026-05-18T12:00:00.000Z", deletedAt: null,
  },
];
