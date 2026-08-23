import type { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import Header from "./Header";
import Footer from "./Footer";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
