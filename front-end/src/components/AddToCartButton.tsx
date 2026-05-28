"use client";

import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasActiveSession } from "@/lib/auth-session";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types/product";

type AddToCartButtonProps = {
  product: Product;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addToCart, items, isSyncing } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stock = Math.max(0, product.stock);
  const isAvailable = stock > 0;
  const isInCart = items.some((item) => item.productId === product.id);
  const isCheckingCart = isSyncing && isAvailable;
  const shouldShowQuantitySelector = isAvailable && !isInCart && !isCheckingCart;
  const canDecreaseQuantity = quantity > 1;
  const canIncreaseQuantity = quantity < stock;
  const buttonWidthClassName = shouldShowQuantitySelector
    ? "sm:flex-1 md:min-w-56 md:max-w-sm"
    : "sm:w-auto sm:min-w-44 sm:max-w-56";

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => Math.min(stock, currentQuantity + 1));
  };

  const handleAddToCart = async () => {
    setErrorMessage("");

    if (!hasActiveSession()) {
      router.push("/login");
      return;
    }

    if (!isAvailable || isAdding || isCheckingCart) {
      return;
    }

    if (isInCart) {
      router.push("/carrito");
      return;
    }

    setIsAdding(true);

    try {
      await addToCart(product, quantity);
      router.push("/carrito?added=1");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto al carrito.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {shouldShowQuantitySelector ? (
          <div className="inline-flex h-12 w-full overflow-hidden rounded-xl border border-[#D9E2EC] bg-[#F4F7FB] shadow-sm sm:w-auto">
            <button
              type="button"
              disabled={!canDecreaseQuantity || isAdding}
              onClick={decreaseQuantity}
              className="flex w-12 items-center justify-center text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              aria-label={`Disminuir cantidad de ${product.nombre}`}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="flex min-w-14 flex-1 items-center justify-center border-x border-[#D9E2EC] bg-white px-4 text-sm font-extrabold text-[#111111] sm:flex-none">
              {quantity}
            </span>
            <button
              type="button"
              disabled={!canIncreaseQuantity || isAdding}
              onClick={increaseQuantity}
              className="flex w-12 items-center justify-center text-[#003791] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              aria-label={`Aumentar cantidad de ${product.nombre}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          disabled={!isAvailable || isAdding || isCheckingCart}
          onClick={() => void handleAddToCart()}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-sm font-bold shadow-sm transition-all duration-300 ${buttonWidthClassName} ${
            !isAvailable
              ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
              : isInCart
                ? "border border-[#005BFF] bg-[#EAF3FF] text-[#003791] shadow-[0_14px_30px_rgba(0,91,255,0.14)] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_38px_rgba(0,91,255,0.18)]"
                : "bg-[#003791] text-white shadow-[0_16px_35px_rgba(0,55,145,0.22)] hover:-translate-y-0.5 hover:bg-[#005BFF] hover:shadow-[0_20px_45px_rgba(0,91,255,0.26)] disabled:cursor-wait disabled:bg-[#005BFF]/80 disabled:hover:translate-y-0"
          }`}
        >
          {isAdding || isCheckingCart ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : isInCart && isAvailable ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          )}
          {isAdding
            ? "Agregando..."
            : isCheckingCart
              ? "Sincronizando..."
              : !isAvailable
                ? "Agotado"
                : isInCart
                  ? "En el carrito"
                  : "Agregar al carrito"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
