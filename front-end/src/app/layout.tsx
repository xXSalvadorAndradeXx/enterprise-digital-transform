import type { Metadata } from "next";
import {
  Geist_Mono,
  Fredoka,
  Inter,
} from "next/font/google";

import Layout from "@/components/layout/Layout";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iris Accesorios | Tienda en línea",
  description:
    "Descubre los accesorios de Iris y compra en línea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fredoka.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
