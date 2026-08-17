import { ProductPreviewPage } from "@/components/productos/ProductPreviewPage";

export default function ProductPreviewRoute() {
  const product = {
    id: "demo-product",
    commercialName: "Camisa de algodón",
    description:
      "Camisa azul de algodón premium con corte moderno y diseño minimalista.",
    category: "Ropa",
    sku: "RB-TSHIRT-BLUE-001",
    salePrice: 43.75,
    discount: 20,
    effectivePrice: 35,
    stock: 150,
    stockLabel: "Stock",
    status: "ACTIVE" as const,
    tags: ["Camiseta", "Negro", "Algodón", "Premium"],
    images: [
      {
        id: "1",
        imageUrl: "/images/producto-demo-1.png",
        sortOrder: 1,
      },
      {
        id: "2",
        imageUrl: "/images/producto-demo-2.png",
        sortOrder: 2,
      },
      {
        id: "3",
        imageUrl: "/images/producto-demo-3.png",
        sortOrder: 3,
      },
    ],
  };

  return <ProductPreviewPage product={product} />;
}