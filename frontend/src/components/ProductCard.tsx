interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function ProductCard({
  name,
  price,
  image,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition">

      {/* Imagen */}
      <img
        src={image}
        alt={name}
        className="w-full h-52 object-cover rounded-lg"
      />

      {/* Nombre */}
      <h2 className="text-xl font-semibold mt-4 text-black">
        {name}
      </h2>

      {/* Precio */}
      <p className="text-blue-600 text-lg font-bold mt-2">
        ${price}
      </p>

      {/* Botón */}
      <button
        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Ver producto
      </button>

    </div>
  );
}