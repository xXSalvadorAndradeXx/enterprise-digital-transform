import { formatCurrency } from "@/utils/formatCurrency";

interface ProductBasicInformationProps {
  category: string;
  salePrice: number;
  stock: number;
  stockLabel: string;
}

export function ProductBasicInformation({
  category,
  salePrice,
  stock,
  stockLabel,
}: ProductBasicInformationProps) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Información básica
      </h3>

      <dl className="max-w-md text-sm">
        <div className="grid grid-cols-2 border-b border-gray-300 px-2 py-3">
          <dt className="text-gray-500">
            Categoría
          </dt>

          <dd className="truncate text-gray-700">
            {category}
          </dd>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 px-2 py-3">
          <dt className="text-gray-500">
            Precio
          </dt>

          <dd className="text-gray-700">
            {formatCurrency(salePrice)}
          </dd>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 px-2 py-3">
          <dt className="text-gray-500">
            Stock
          </dt>

          <dd className="text-gray-700">
            {stock.toLocaleString("en-US")} unidades
          </dd>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 px-2 py-3">
          <dt className="text-gray-500">
            Estado del producto
          </dt>

          <dd className="text-gray-700">
            {stockLabel}
          </dd>
        </div>
      </dl>
    </section>
  );
}