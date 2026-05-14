import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

async function getProducts(): Promise<Product[]> {

  const response = await fetch(
    "http://localhost:3000/api/products",
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  // Verifica que sea un array
  return Array.isArray(data)
    ? data
    : [];
}

export default async function ProductosPage() {

  const products = await getProducts();

  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold mb-8 text-white">
        Productos
      </h1>

      {/* Estado vacío */}
      {products.length === 0 ? (

        <p className="text-gray-500">
          No hay productos disponibles
        </p>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {products.map((product) => (

            <ProductCard
              key={product.id}
              image={product.image}
              name={product.name}
              price={product.price}
              buttonText="Ver Producto"
            />

          ))}

        </div>

      )}

    </div>
  );
}