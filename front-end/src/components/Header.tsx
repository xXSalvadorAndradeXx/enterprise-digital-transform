import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          E-Commerce
        </Link>

        <div className="flex gap-6 text-sm font-medium">
          <Link href="/" className="text-gray-700 hover:text-blue-600">
            Inicio
          </Link>

          <Link href="/login" className="text-gray-700 hover:text-blue-600">
            Login
          </Link>

          <Link href="/registro" className="text-gray-700 hover:text-blue-600">
            Registro
          </Link>
        </div>
      </nav>
    </header>
  );
}