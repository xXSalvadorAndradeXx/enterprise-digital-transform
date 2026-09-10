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
      <h3 className="mb-4 text-base font-bold text-gray-900">
        Información básica
      </h3>

      <dl className="space-y-0 text-sm">
        <div className="flex items-center justify-between border-b border-gray-200 py-3">
          <dt className="text-gray-500">
            Categoría
          </dt>

          <dd className="font-medium text-gray-900">
            {category}
          </dd>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 py-3">
          <dt className="text-gray-500">
            Precio
          </dt>

          <dd className="font-medium text-gray-900">
            {formatCurrency(salePrice)}
          </dd>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 py-3">
          <dt className="text-gray-500">
            Stock
          </dt>

          <dd className="font-medium text-gray-900">
            {stock.toLocaleString("en-US")}
          </dd>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 py-3">
          <dt className="text-gray-500">
            Estado del producto
          </dt>

          <dd className="font-medium text-gray-900">
            {stockLabel}
          </dd>
        </div>
      </dl>
    </section>
  );
}