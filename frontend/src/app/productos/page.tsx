import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

async function getProducts(
  searchParams: {
    name?: string;
    category?: string;
    price?: string;
  }
): Promise<Product[]> {

  const params = new URLSearchParams();

  if (searchParams.name) {
    params.append("name", searchParams.name);
  }

  if (searchParams.category) {
    params.append(
      "category",
      searchParams.category
    );
  }

  if (searchParams.price) {
    params.append(
      "price",
      searchParams.price
    );
  }

  const response = await fetch(
    `http://localhost:3000/api/products?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return Array.isArray(data)
    ? data
    : [];
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: {
    name?: string;
    category?: string;
    price?: string;
  };
}) {

  const products = await getProducts(
    searchParams
  );

  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold mb-8 text-white">
        Productos
      </h1>

      <ProductFilters />

      {/* Estado vacío */}
      {products.length === 0 ? (

        <p className="text-white-500">
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