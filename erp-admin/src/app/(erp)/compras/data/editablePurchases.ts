import type { EditablePurchase } from "../types/purchaseEdit.types";

const PDF_PLACEHOLDER =
  "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0Y=";

const IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23f7f7f8'/%3E%3Crect x='38' y='28' width='244' height='124' rx='8' fill='white' stroke='%23878a92'/%3E%3Ctext x='160' y='84' text-anchor='middle' font-family='Arial' font-size='18' fill='%23202124'%3EFactura%3C/text%3E%3Ctext x='160' y='110' text-anchor='middle' font-family='Arial' font-size='13' fill='%234a4a4a'%3ECompra 002%3C/text%3E%3C/svg%3E";

export const EDITABLE_PURCHASES: readonly EditablePurchase[] = [
  {
    id: "001",
    reference: "1234",
    date: "2026-05-18",
    supplierId: "global",
    product: {
      id: "mock-product-001",
      name: "nike ford",
      sku: "NK-FORD-001",
      category: "fashion",
      variants: [
        { id: "mock-001-s", size: "S", color: "#000000", quantity: "35", unitCost: "3.10" },
        { id: "mock-001-m", size: "M", color: "#000000", quantity: "30", unitCost: "3.10" },
        { id: "mock-001-l", size: "L", color: "#000000", quantity: "35", unitCost: "3.10" },
      ],
    },
    existingInvoice: {
      name: "factura-compra-001.pdf",
      mimeType: "application/pdf",
      url: PDF_PLACEHOLDER,
    },
  },
  {
    id: "002",
    reference: "1235",
    date: "2026-05-18",
    supplierId: "local",
    product: {
      id: "mock-product-002",
      name: "nike low 1",
      sku: "NK-LOW-002",
      category: "footwear",
      variants: [
        { id: "mock-002-38", size: "38", color: "#FFFFFF", quantity: "30", unitCost: "3.50" },
        { id: "mock-002-39", size: "39", color: "#FFFFFF", quantity: "30", unitCost: "3.50" },
        { id: "mock-002-40", size: "40", color: "#FFFFFF", quantity: "30", unitCost: "3.50" },
      ],
    },
    existingInvoice: {
      name: "factura-compra-002.jpg",
      mimeType: "image/jpeg",
      url: IMAGE_PLACEHOLDER,
    },
  },
];

export function findEditablePurchase(id: string): EditablePurchase | undefined {
  return EDITABLE_PURCHASES.find((purchase) => purchase.id === id);
}
