"use client";

import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types/product";

const testProduct: Product = {
  id: 0,
  nombre: "Producto de prueba",
  descripcion: "Producto usado solo para validar el hook del carrito.",
  precio: 10,
  stock: 5,
  imagenUrl: "",
  createdAt: "2026-05-23T00:00:00.000Z",
  category: null,
};

export default function CartHookTest() {
  const {
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  return (
    <div className="hidden" aria-hidden="true">
      <p>
        {items.length} items - {totalItems} unidades - ${totalPrice}
      </p>
      <button type="button" onClick={() => addToCart(testProduct, 1)}>
        Probar agregar
      </button>
      <button type="button" onClick={() => updateQuantity(testProduct.id, 2)}>
        Probar actualizar
      </button>
      <button type="button" onClick={() => removeFromCart(testProduct.id)}>
        Probar eliminar
      </button>
      <button type="button" onClick={clearCart}>
        Probar limpiar
      </button>
    </div>
  );
}