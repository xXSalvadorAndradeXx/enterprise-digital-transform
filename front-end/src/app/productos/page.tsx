import ProductCard from "@/components/ProductCard";
import type { ProductsResponse } from "@/types/product";

const PRODUCTS_ENDPOINT = "http://localhost:3000/products?limit=10&offset=0";
const PRODUCTS_ERROR_MESSAGE = "No se pudieron cargar los productos.";

async function getProducts() {
  try {
    const response = await fetch(PRODUCTS_ENDPOINT, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        products: [],
        total: 0,
        errorMessage: PRODUCTS_ERROR_MESSAGE,
      };
    }

    const responseData = (await response.json()) as ProductsResponse;
    const products = Array.isArray(responseData.data?.products)
      ? responseData.data.products
      : [];
    const total =
      typeof responseData.data?.total === "number"
        ? responseData.data.total
        : products.length;

    return {
      products,
      total,
      errorMessage: "",
    };
  } catch {
    return {
      products: [],
      total: 0,
      errorMessage: PRODUCTS_ERROR_MESSAGE,
    };
  }
}

export default async function ProductosPage() {
  const { products, total, errorMessage } = await getProducts();

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-6 py-10 text-[#111111]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-[#D9E2EC] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase text-[#003791]">
              Catalogo
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
              Productos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Elige tecnología de las mejores marcas, encuentra productos modernos y de la más alta calidad.

            </p>
          </div>

          {!errorMessage ? (
            <div className="inline-flex items-center gap-3 rounded-xl border border-[#D9E2EC] bg-white px-5 py-3 shadow-[0_12px_30px_rgba(0,55,145,0.08)]">
              <span className="text-xs font-bold uppercase text-slate-500">
                Total
              </span>
              <span className="rounded-lg bg-[#EAF3FF] px-3 py-1 text-lg font-extrabold text-[#003791]">
                {total}
              </span>
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-xl border border-red-100 bg-white px-5 py-4 text-sm font-semibold text-red-700 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            {errorMessage}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#D9E2EC] bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-[0_12px_30px_rgba(17,17,17,0.06)]">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
