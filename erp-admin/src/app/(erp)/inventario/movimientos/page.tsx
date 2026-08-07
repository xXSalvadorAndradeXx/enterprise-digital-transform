import MovementTable from "../components/MovementTable";

export default function MovimientosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold text-black">
          Movimiento de inventario
        </h1>

        <p className="mt-2 text-2xl text-gray-600">
          Registro de entradas y salidas.
        </p>
      </div>

      <MovementTable />
    </div>
  );
}