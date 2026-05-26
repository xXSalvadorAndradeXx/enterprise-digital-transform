import type { Metadata } from "next";
import "./globals.css";

import MainLayout from "@/components/MainLayout";

import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {

  title: "E-Commerce",

  description:
    "Proyecto E-Commerce",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html lang="es">

      <body>

        <CartProvider>

          <MainLayout>

            {children}

          </MainLayout>

        </CartProvider>

      </body>

    </html>

  );

}