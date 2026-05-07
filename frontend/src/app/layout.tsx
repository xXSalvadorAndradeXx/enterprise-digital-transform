import "./globals.css";
import MainLayout from "../components/MainLayout";

export const metadata = {
  title: "E-Commerce",
  description: "Proyecto Fullstack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}