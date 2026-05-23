import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/product";

interface ProductCardProps extends Product {}

export default function ProductCard({
  name,
  price,
  image,
  buttonText,
}: ProductCardProps) {

  const { addToCart } = useCart();

  return (

    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition">

        <Image
          src={image}
          alt={name}
          width={500}
          height={300}
          className="
           w-full
           h-48
           sm:h-56
           md:h-64
           object-cover
           rounded-lg
          " 
        />

      <h2 className="text-lg sm:text-xl font-semibold mt-4 text-black">
        {name}
      </h2>

      <p className="text-blue-600 text-lg font-bold mt-2">
        ${price}
      </p>

      <button
      onClick={() =>
   addToCart({
    id,
    name,
    price,
    image,
    quantity: 1,
  })
}
        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>

    </div>
  );
}