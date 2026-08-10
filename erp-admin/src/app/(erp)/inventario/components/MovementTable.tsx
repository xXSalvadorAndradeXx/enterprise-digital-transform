"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMovements } from "../hooks/useMovements";
import { MovementChannel, MovementType } from "../types";
import {
  Search,
  ArrowUp,
  ArrowDown,
  Monitor,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  type LucideIcon,
} from "lucide-react";

/**
 * Tipos locales del prototipo (mock). `rows` todavía no viene de la API,
 * así que estos tipos NO son los DTOs del contrato — cuando se conecte a
 * GET /inventory-movements, reemplazar por `MovementResponseDto` /
 * `MovementViewModel` desde "@/types/inventario" y borrar este bloque.
 */



interface ChannelStyle {
  readonly icon: LucideIcon;
  readonly color: string;
}



function getDateRange(value: string): {
  dateFrom: string;
  dateTo: string;
} | null {
  const now = new Date();

  if (value === "Hoy") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    };
  }

  if (value === "Esta semana") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);

    const day = from.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    from.setDate(from.getDate() + diff);

    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    };
  }

  if (value === "Este mes") {
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    const to = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    };
  }

  return null;
}


export default function MovementTable() {
  const {
  query,
  updateQuery,
  items,
  meta,
  loading,
  error,
  retry,
} = useMovements();

const [searchInput, setSearchInput] = useState(query.search ?? "");

useEffect(() => {
  const timeout = setTimeout(() => {
    updateQuery({
      search: searchInput || undefined,
    });
  }, 400);

  return () => clearTimeout(timeout);
}, [searchInput, updateQuery]);

const CHANNEL_STYLES: Record<MovementChannel, ChannelStyle> = {
  [MovementChannel.ECOMMERCE]: {
    icon: Monitor,
    color: "text-blue-500",
  },
  [MovementChannel.TIENDA_FISICA]: {
    icon: Store,
    color: "text-fuchsia-500",
  },
};
  const [tipo, setTipo] = useState<MovementType | null>(null);
  const [canal, setCanal] = useState<MovementChannel| "Todos">("Todos");
  const [fecha, setFecha] = useState("");
  const [dateError, setDateError] = useState("");

  const router = useRouter();
  if (loading) {
  return (
    <div className="flex min-h-[250px] items-center justify-center">
      <p className="text-sm text-gray-500">
        Cargando movimientos...
      </p>
    </div>
  );
}

if (error) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
      <p className="text-sm text-red-500">
        {error}
      </p>

      <button
        type="button"
        onClick={retry}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}

  

  

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        {/* Buscar */}
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="Buscar"
  className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
/>               </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Dropdown<string>
            label="Fecha"
            display={fecha || "Fecha"}
            selected={fecha || null}
            options={[
              { value: "Hoy", label: "Hoy" },
              { value: "Esta semana", label: "Esta semana" },
              { value: "Este mes", label: "Este mes" },
            ]}
            onSelect={(value) => {
  setDateError("");
  setFecha(value);

  const range = getDateRange(value);

  if (!range) {
    updateQuery({
      dateFrom: undefined,
      dateTo: undefined,
    });
    return;
  }

  updateQuery(range);
}}
          />

          <Dropdown<MovementType>
  label="Tipo"
  display={tipo === MovementType.NUEVO_PRODUCTO ? "Entrada" : tipo === MovementType.SALIDA ? "Salida" : "Tipo"}
  options={[
    {
      value: MovementType.NUEVO_PRODUCTO,
      label: "Entrada",
    },
    {
      value: MovementType.SALIDA,
      label: "Salida",
    },
  ]}
  selected={tipo}
  onSelect={(value) => {
    setTipo(value);

    updateQuery({
      type: value,
    });
  }}
/>

          <Dropdown<MovementChannel | "Todos">
            label="Canal"
            display={canal === "Todos" ? "Canal: Todos" : `Canal: ${canal}`}
            options={[
              { value: "Todos", label: "Todos los canales" },
              {
                 value: MovementChannel.ECOMMERCE,
                label: "Tienda en línea",
                icon: Monitor,
                iconColor: "text-blue-500",
              },
              {
                 value: MovementChannel.TIENDA_FISICA,
                label: "Tienda física",
                icon: Store,
                iconColor: "text-fuchsia-500",
              },
            ]}
            selected={canal}
            onSelect={(value) => {
            setCanal(value);

            updateQuery({
  channel: value === "Todos" ? undefined : value,
});
             }}
          />
        </div>
      </div>

      {dateError && <p className="px-6 pt-2 text-sm text-red-500">{dateError}</p>}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-[#ECECFF]">
            <tr className="h-14 text-sm font-semibold text-gray-800">
              <th className="text-center font-semibold">Fecha</th>
              <th className="text-center font-semibold">Producto</th>
              <th className="text-center font-semibold">Tipo</th>
              <th className="text-center font-semibold">Cantidad</th>
              <th className="text-center font-semibold">Canal</th>
              <th className="text-center font-semibold">Responsable</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const isEntrada = item.direction === "ENTRADA";
             const channel = CHANNEL_STYLES[item.channel];
                 const ChannelIcon = channel.icon;

              return (
                <tr
                  key={index}
                  className="h-16 border-b border-gray-100 text-center text-sm text-gray-700"
                >
                  <td className="text-gray-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="text-gray-700">{item.inventoryName}</td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium ${
                        isEntrada ? "bg-[#DDF6DA] text-[#2F9E44]" : "bg-[#FFE0E0] text-[#E03131]"
                      }`}
                    >
                      {isEntrada ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                      {item.direction}
                    </span>
                  </td>
                  <td className="text-gray-700">{item.quantity}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <ChannelIcon className={`h-4 w-4 ${channel.color}`} />
                      {item.channel}
                    </span>
                  </td>
                  <td className="text-gray-700">{item.responsibleUser
                                                    ? `${item.responsibleUser.firstName} ${item.responsibleUser.lastName}`
                                                     : "-"}</td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500 sm:justify-end sm:px-8">
        <button
  onClick={() =>
    updateQuery({
      page: Math.max(1, meta.page - 1),
    })
  }
  disabled={meta.page === 1}
  className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40"
>
  <ChevronLeft className="h-4 w-4" />
</button>

<span className="px-3">
  Página {meta.page} de {meta.totalPages || 1}
</span>

<button
  onClick={() =>
    updateQuery({
      page: Math.min(meta.totalPages, meta.page + 1),
    })
  }
  disabled={meta.page >= meta.totalPages}
  className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40"
>
  <ChevronRight className="h-4 w-4" />
</button>
<div className="flex justify-center px-4 pb-6 pt-4 sm:justify-end sm:px-8">
  <button
    onClick={() => router.push("/inventario")}
    className="h-12 w-full max-w-xs rounded border-2 border-blue-600 text-lg font-medium text-blue-600 transition hover:bg-blue-50 sm:w-36"
  >
    Volver
  </button>
</div>
      </div>
    </div>
  );
}

/** Opción genérica de un Dropdown. `T` es el tipo del valor seleccionable. */
interface DropdownOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: LucideIcon;
  readonly iconColor?: string;
}

interface DropdownProps<T extends string> {
  readonly label: string;
  readonly display: string;
  readonly options: readonly DropdownOption<T>[];
  readonly selected: T | null;
  readonly onSelect: (value: T) => void;
}

function Dropdown<T extends string>({ label, display, options, selected, onSelect }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasOptions = options.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => hasOptions && setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm ${
          open ? "border-blue-500 text-blue-600" : "border-gray-300 text-gray-700"
        } bg-white`}
      >
        {display}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && hasOptions && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg sm:left-0 sm:right-auto">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  isSelected ? "font-medium text-gray-900" : "text-gray-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className={`h-4 w-4 ${opt.iconColor || "text-gray-400"}`} />}
                  {opt.label}
                </span>
                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
