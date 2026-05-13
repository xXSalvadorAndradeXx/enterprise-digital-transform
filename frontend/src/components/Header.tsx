import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between p-4">

        <h1 className="text-2xl font-bold">
          E-Commerce
        </h1>

        <nav className="flex gap-6">

          <Link
            href="/"
            className="hover:text-gray-300 transition"
          >
            Inicio
          </Link>

          <Link
            href="/productos"
            className="hover:text-gray-300 transition"
          >
            Productos
          </Link>

          <Link
            href="/login"
            className="hover:text-gray-300 transition"
          >
            Login
          </Link>

          <Link
            href="/registro"
            className="hover:text-gray-300 transition"
          >
            Registro
          </Link>


         

        </nav>
      </div>
    </header>
  );
}