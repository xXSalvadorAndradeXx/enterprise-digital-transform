import ProductCard from "@/components/ProductCard";

async function getProducts() {
  const response = await fetch(
    "http://localhost:3000/api/products",
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Error al obtener productos"
    );
  }

  return response.json();
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

          {products.map((product: any) => (

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