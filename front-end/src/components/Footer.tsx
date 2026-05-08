import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-gradient-to-r from-gray-950 via-gray-900 to-blue-950 px-6 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {/* MARCA */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg">
              E
            </div>

            <div>
              <h2 className="text-xl font-extrabold">
                E-<span className="text-blue-400">Commerce</span>
              </h2>
              <p className="text-xs text-gray-400">Tienda virtual moderna</p>
            </div>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-6 text-gray-300">
            Proyecto frontend desarrollado con Next.js, TypeScript y Tailwind
            CSS, enfocado en una experiencia de usuario clara, moderna y
            adaptable.
          </p>
        </div>

        {/* ENLACES */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-300">
            Navegación
          </h3>

          <div className="flex flex-col gap-3 text-sm">
            <Link
              href="/"
              className="text-gray-300 transition hover:text-blue-400"
            >
              Inicio
            </Link>

            <Link
              href="/login"
              className="text-gray-300 transition hover:text-blue-400"
            >
              Login
            </Link>

            <Link
              href="/registro"
              className="text-gray-300 transition hover:text-blue-400"
            >
              Registro
            </Link>
          </div>
        </div>

        {/* TECNOLOGÍAS */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-300">
            Tecnologías utilizadas
          </h3>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-gray-200">
              Next.js
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-gray-200">
              TypeScript
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-gray-200">
              Tailwind CSS
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-gray-200">
              Sprint 2
            </span>
          </div>
        </div>
      </div>

      {/* LÍNEA INFERIOR */}
      <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center text-xs text-gray-400 md:flex-row">
        <p>© 2026 E-Commerce. Proyecto académico de frontend.</p>

        <p className="rounded-full bg-blue-600/20 px-4 py-2 text-blue-300">
          Prototipado y Plan Fullstack
        </p>
      </div>
    </footer>
  );
}