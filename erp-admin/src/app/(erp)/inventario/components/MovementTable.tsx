"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

const CHANNEL_STYLES = {
  "Tienda en línea": { icon: Monitor, color: "text-blue-500" },
  "Tienda física": { icon: Store, color: "text-fuchsia-500" },
};

const rows = [
  { tipo: "Entrada", canal: "Tienda en línea", responsable: "Emilio Reyes", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda física", responsable: "Fernando Esquivel", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda en línea", responsable: "Diego Zepeda", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda física", responsable: "María Salgado", cantidad: 45 },
  { tipo: "Salida", canal: "Tienda en línea", responsable: "Salvador Andrade", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda en línea", responsable: "Mónica Campos", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda física", responsable: "Víctor Rivas", cantidad: 45 },
  { tipo: "Entrada", canal: "Tienda en línea", responsable: "Alex Orellana", cantidad: 45 },
];

export default function MovementTable() {
  const [tipo, setTipo] = useState(null);
  const [canal, setCanal] = useState("Todos");
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        {/* Buscar */}
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar"
            className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Dropdown label="Fecha" display="Fecha" options={[]} />

          <Dropdown
            label="Tipo"
            display={tipo || "Tipo"}
            options={[
              { value: "Entrada", label: "Entrada" },
              { value: "Salida", label: "Salida" },
            ]}
            selected={tipo}
            onSelect={setTipo}
          />

          <Dropdown
            label="Canal"
            display={canal === "Todos" ? "Canal: Todos" : `Canal: ${canal}`}
            options={[
              { value: "Todos", label: "Todos los canales" },
              { value: "Tienda en línea", label: "Tienda en línea", icon: Monitor, iconColor: "text-blue-500" },
              { value: "Tienda física", label: "Tienda física", icon: Store, iconColor: "text-fuchsia-500" },
            ]}
            selected={canal}
            onSelect={setCanal}
          />
        </div>
      </div>

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
            {rows.map((item, index) => {
              const isEntrada = item.tipo === "Entrada";
              const channel = CHANNEL_STYLES[item.canal];
              const ChannelIcon = channel.icon;

              return (
                <tr key={index} className="h-16 border-b border-gray-100 text-center text-sm text-gray-700">
                  <td className="text-gray-700">24/07/2025</td>
                  <td className="text-gray-700">Camisa de algodón</td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium ${
                        isEntrada ? "bg-[#DDF6DA] text-[#2F9E44]" : "bg-[#FFE0E0] text-[#E03131]"
                      }`}
                    >
                      {isEntrada ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                      {item.tipo}
                    </span>
                  </td>
                  <td className="text-gray-700">{item.cantidad}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <ChannelIcon className={`h-4 w-4 ${channel.color}`} />
                      {item.canal}
                    </span>
                  </td>
                  <td className="text-gray-700">{item.responsable}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500 sm:justify-end sm:px-8">
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 font-medium text-black">
          1
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">2</button>
        <span className="px-1">...</span>
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">23</button>
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">24</button>

        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Botón volver */}
      <div className="flex justify-center px-4 pb-6 sm:justify-end sm:px-8">
       <button
         onClick={() => router.push("/inventario")}
         className="h-12 w-full max-w-xs rounded border-2 border-blue-600 text-lg font-medium text-blue-600 transition hover:bg-blue-50 sm:w-36"
          >
           Volver
           </button>
      </div>
    </div>
  );
}

function Dropdown({ label, display, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
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
