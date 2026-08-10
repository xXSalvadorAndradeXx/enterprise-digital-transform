"use client";

export type MockInventoryVariant = {
  size: string;
  color: string;
  stock: number;
  unitCost: number;
};

export type MockInventoryProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  variants: MockInventoryVariant[];
};

const STORAGE_KEY = "erp_mock_inventory";

export const DEFAULT_MOCK_INVENTORY: readonly MockInventoryProduct[] = [
  {
    id: "mock-raw-black-t-shirt",
    name: "Raw Black T-Shirt",
    sku: "RAW-BLACK-001",
    category: "Moda",
    brand: "Raw",
    variants: [
      { size: "S", color: "#000000", stock: 35, unitCost: 5 },
      { size: "M", color: "#000000", stock: 12, unitCost: 5 },
      { size: "L", color: "#000000", stock: 28, unitCost: 5 },
    ],
  },
  {
    id: "mock-camisa-blanca",
    name: "Camisa blanca",
    sku: "CAM-BLANCA-002",
    category: "Moda",
    brand: "Woden",
    variants: [
      { size: "S", color: "#FFFFFF", stock: 14, unitCost: 7.5 },
      { size: "M", color: "#FFFFFF", stock: 20, unitCost: 7.5 },
      { size: "L", color: "#FFFFFF", stock: 9, unitCost: 7.5 },
    ],
  },
  {
    id: "mock-jeans-azul",
    name: "Jeans azul",
    sku: "JEANS-AZUL-003",
    category: "Moda",
    brand: "Denim Co.",
    variants: [
      { size: "28", color: "#1E3A8A", stock: 8, unitCost: 12 },
      { size: "30", color: "#1E3A8A", stock: 11, unitCost: 12 },
      { size: "32", color: "#1E3A8A", stock: 6, unitCost: 12 },
    ],
  },
];

export function getMockInventory(): readonly MockInventoryProduct[] {
  if (typeof window === "undefined") return DEFAULT_MOCK_INVENTORY;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_MOCK_INVENTORY;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? (parsed as MockInventoryProduct[])
      : DEFAULT_MOCK_INVENTORY;
  } catch {
    return DEFAULT_MOCK_INVENTORY;
  }
}

export function findMockInventoryProduct(
  productId: string,
): MockInventoryProduct | undefined {
  return getMockInventory().find((product) => product.id === productId);
}

export function applyMockRestock(
  productId: string,
  quantities: readonly { size: string; quantity: number }[],
): void {
  if (typeof window === "undefined") return;

  const inventory = getMockInventory().map((product) => {
    if (product.id !== productId) return product;

    return {
      ...product,
      variants: product.variants.map((variant) => {
        const entry = quantities.find((item) => item.size === variant.size);
        return {
          ...variant,
          stock: variant.stock + (entry?.quantity ?? 0),
        };
      }),
    };
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}
