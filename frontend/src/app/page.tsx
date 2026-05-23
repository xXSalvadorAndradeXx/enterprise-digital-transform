"use client";

import { useEffect, useState } from "react";

import ProductCard from "@/components/ProductCard";

import { useCart } from "@/context/CartContext";

interface Product {

  id: string;

  image: string;

  name: string;

  price: number;

}

export default function HomePage() {

  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>([]);

  const {
    cartItems,
    addToCart,
  } = useCart();

  /* =========================
     Obtener productos
  ========================= */

  useEffect(() => {

    async function getFeaturedProducts() {

      const response = await fetch(
        "http://localhost:3000/api/products",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {

        setFeaturedProducts([]);

        return;

      }

      const data = await response.json();

      setFeaturedProducts(

        Array.isArray(data.data)
          ? data.data
          : []

      );

    }

    getFeaturedProducts();

  }, []);

  

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-8 text-white">
        Productos Destacados
      </h1>

      {featuredProducts.length === 0 ? (

        <p className="text-white">
          No hay productos disponibles
        </p>

      ) : (

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            gap-6
          "
        >

          {featuredProducts.map((product) => (

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