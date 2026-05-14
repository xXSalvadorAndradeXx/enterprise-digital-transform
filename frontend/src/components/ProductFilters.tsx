
"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function ProductFilters() {

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const handleFilter = (
    key: string,
    value: string
  ) => {

    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(
      `/productos?${params.toString()}`
    );
  };

  return (

    <div className="flex flex-col md:flex-row gap-4 mb-8">

      {/* Buscar */}
      <input
        type="text"
        placeholder="Buscar producto..."
        onChange={(e) =>
          handleFilter(
            "name",
            e.target.value
          )
        }
        className="border p-2 rounded text-black"
      />

      {/* Categoría */}
      <select
        onChange={(e) =>
          handleFilter(
            "category",
            e.target.value
          )
        }
        className="border p-2 rounded text-black"
      >

        <option value="">
          Todas las categorías
        </option>

        <option value="gaming">
          Gaming
        </option>

        <option value="accesorios">
          Accesorios
        </option>

      </select>

      {/* Precio */}
      <select
        onChange={(e) =>
          handleFilter(
            "price",
            e.target.value
          )
        }
        className="border p-2 rounded text-black"
      >

        <option value="">
          Todos los precios
        </option>

        <option value="50">
          Menor a $50
        </option>

        <option value="100">
          Menor a $100
        </option>

      </select>

    </div>
  );
}