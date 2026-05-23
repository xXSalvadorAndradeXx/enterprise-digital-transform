import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-black text-white shadow-md">

  <div className="
    container
    mx-auto
    flex
    flex-col
    sm:flex-row
    items-center
    justify-between
    p-4
    gap-4
  ">

    <h1 className="
      text-2xl
      font-bold
      text-center
      sm:text-left
    ">
      E-Commerce
    </h1>

    <nav className="
      flex
      flex-wrap
      justify-center
      gap-4
      sm:gap-6
    ">

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