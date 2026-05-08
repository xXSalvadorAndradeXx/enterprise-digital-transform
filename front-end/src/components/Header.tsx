import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 shadow-md backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md">
            E
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              E-<span className="text-blue-600">Commerce</span>
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Tienda virtual
            </p>
          </div>
        </Link>

        {/* MENÚ */}
        <div className="hidden items-center gap-3 text-sm font-semibold md:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Inicio
          </Link>

          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Login
          </Link>

          <Link
            href="/registro"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
          >
            Registro
          </Link>
        </div>

        {/* BOTÓN MÓVIL VISUAL */}
        <div className="flex md:hidden">
          <Link
            href="/registro"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            Registro
          </Link>
        </div>
      </nav>
    </header>
  );
}