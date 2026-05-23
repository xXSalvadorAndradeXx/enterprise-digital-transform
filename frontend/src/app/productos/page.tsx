import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

interface ProductosPageProps {
  searchParams: {
    name?: string;
    category?: string;
    price?: string;
  };
}

async function getProducts(
  searchParams: ProductosPageProps["searchParams"]
): Promise<Product[]> {

  const query = new URLSearchParams();

  // Nombre
  if (searchParams.name) {
    query.append("name", searchParams.name);
  }

  // Categoría
  if (searchParams.category) {
    query.append(
      "category",
      searchParams.category
    );
  }

  // Precio
  if (searchParams.price) {
    query.append(
      "price",
      searchParams.price
    );
  }

  const response = await fetch(
    `http://localhost:3000/api/products?${query.toString()}`,
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
}: ProductosPageProps) {

  const products =
    await getProducts(searchParams);

  return (

    <div className="p-10">

      <h1 className="text-4xl font-bold mb-8 text-white">
        Productos
      </h1>

      <ProductFilters />

      {/* Estado vacío */}
      {products.length === 0 ? (

        <p className="text-gray-200 text-xl">
          No se encontraron productos
        </p>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {products.map((product) => (

            <ProductCard
              key={product.id}
              id={product.id}
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