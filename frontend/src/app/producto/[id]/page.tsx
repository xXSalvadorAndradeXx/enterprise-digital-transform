import { notFound } from "next/navigation";

async function getProduct(id: string) {

  const response = await fetch(
    `http://localhost:3000/api/products/${id}`,
    {
      cache: "no-store",
    }
  );

  // Producto no encontrado
  if (!response.ok) {
    return null;
  }

  return response.json();
}

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {

  const product = await getProduct(params.id);

  // 404
  if (!product) {
    notFound();
  }

  return (
    <div className="p-10">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">

        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />

        <h1 className="text-4xl font-bold text-black mb-4">
          {product.name}
        </h1>

        <p className="text-2xl text-blue-600 font-semibold mb-4">
          ${product.price}
        </p>

        <p className="text-gray-700">
          {product.description}
        </p>

      </div>
    </div>
  );
}