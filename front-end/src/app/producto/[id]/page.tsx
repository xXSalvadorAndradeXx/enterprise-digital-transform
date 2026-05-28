import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductDetailImage from "@/components/ProductDetailImage";
import type { Product, ProductDetailResponse } from "@/types/product";

const PRODUCT_ERROR_MESSAGE = "No se pudo cargar el producto.";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProductRequestResult =
  | {
      status: "success";
      product: Product;
    }
  | {
      status: "not-found";
    }
  | {
      status: "error";
    };

function formatProductPrice(price: Product["precio"]) {
  const normalizedPrice = typeof price === "string" ? price.trim() : price;
  const numericPrice =
    normalizedPrice === "" ? Number.NaN : Number(normalizedPrice);

  if (Number.isFinite(numericPrice)) {
    return priceFormatter.format(numericPrice);
  }

  return String(price);
}

function formatProductDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function getProduct(id: string): Promise<ProductRequestResult> {
  try {
    const response = await fetch(
      `http://localhost:3000/products/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return { status: "not-found" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const responseData = (await response.json()) as ProductDetailResponse;
    const product = responseData.data;

    if (!product) {
      return { status: "not-found" };
    }

    return {
      status: "success",
      product,
    };
  } catch {
    return { status: "error" };
  }
}

function ProductNotFoundState() {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[#F4F7FB] px-4 py-8 sm:px-6 sm:py-10">
      <Image
        src="/images/robot-404-producto.png"
        width={1448}
        height={1086}
        alt="Error 404 producto no encontrado"
        className="h-auto w-full max-w-[min(94vw,760px)] object-contain"
      />
    </section>
  );
}

function ProductErrorState() {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10">
      <div className="w-full max-w-md rounded-xl border border-[#D9E2EC] bg-white p-6 text-center shadow-[0_12px_30px_rgba(17,17,17,0.06)] sm:p-8">
        <h1 className="text-2xl font-extrabold text-[#111111]">
          {PRODUCT_ERROR_MESSAGE}
        </h1>
        <Link
          href="/productos"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-[#003791] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a Productos
        </Link>
      </div>
    </section>
  );
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const result = await getProduct(id);

  if (result.status === "not-found") {
    return <ProductNotFoundState />;
  }

  if (result.status === "error") {
    return <ProductErrorState />;
  }

  const { product } = result;
  const isAvailable = product.stock > 0;
  const imageUrl = product.imagenUrl.trim();
  const formattedDate = formatProductDate(product.createdAt);

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-[#F4F7FB] px-4 py-8 text-[#111111] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/productos"
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-semibold text-[#003791] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#005BFF] hover:bg-[#EAF3FF] hover:text-[#005BFF]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a Productos
        </Link>

        <article className="mt-5 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(0,55,145,0.10)] sm:mt-6">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="bg-[#EAF3FF] p-4 sm:p-6 lg:p-7">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-[#D9E2EC] bg-[#F4F7FB]">
                <ProductDetailImage
                  src={imageUrl}
                  alt={product.nombre}
                  priority
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col p-5 sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-center gap-3">
                {product.category ? (
                  <span className="rounded-full border border-[#D9E2EC] bg-[#EAF3FF] px-3 py-1 text-sm font-semibold text-[#003791]">
                    {product.category.nombre}
                  </span>
                ) : null}
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                    isAvailable
                      ? "border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]"
                      : "border-[#D9E2EC] bg-[#F4F7FB] text-slate-500"
                  }`}
                >
                  {isAvailable ? "Disponible" : "Agotado"}
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl lg:text-4xl">
                {product.nombre}
              </h1>

              <p className="mt-4 break-words text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {product.descripcion}
              </p>

              <div className="mt-6 grid gap-4 border-y border-[#D9E2EC] py-5 sm:mt-7 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Precio
                  </p>
                  <p className="mt-1 break-words text-2xl font-extrabold text-[#111111] sm:text-3xl">
                    {formatProductPrice(product.precio)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Stock
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-[#111111]">
                    {product.stock}
                  </p>
                </div>
              </div>

              {formattedDate ? (
                <p className="mt-5 text-sm font-medium text-slate-500">
                  Fecha: {formattedDate}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] px-3 py-3">
                  <p className="text-sm font-bold text-[#111111]">
                    Envio disponible
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Entrega coordinada
                  </p>
                </div>
                <div className="rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] px-3 py-3">
                  <p className="text-sm font-bold text-[#111111]">
                    Pago seguro
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Compra protegida
                  </p>
                </div>
                <div className="rounded-lg border border-[#D9E2EC] bg-[#F4F7FB] px-3 py-3">
                  <p className="text-sm font-bold text-[#111111]">
                    Garantia incluida
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Soporte del producto
                  </p>
                </div>
              </div>

              <AddToCartButton product={product} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
