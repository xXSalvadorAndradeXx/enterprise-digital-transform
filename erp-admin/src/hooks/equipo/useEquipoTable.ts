"use client";

import { useEffect, useMemo, useState } from "react";
import type { Colaborador } from "@/types/equipo";
import { useUsers } from "./useUsers";

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 7;

export function useEquipoTable() {
  // Texto que el usuario ve/escribe en el SearchBar, sin retraso.
  const [searchInput, setSearchInput] = useState("");
  // Texto "debounced" — el que realmente filtra.
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const {
    data: users,
    meta,
    isLoading,
    error,
    refetch,
  } = useUsers({
    page,
    limit: pageSize,
    search,
  });

  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  

  // Un nuevo término de búsqueda o un cambio de tamaño de página siempre
  // regresa a la página 1. Se ajusta durante el render (comparando contra el
  // valor anterior guardado en estado) en vez de en un useEffect, siguiendo
  // el patrón de React para "resetear estado cuando cambia una dependencia".
  const [prevSearch, setPrevSearch] = useState(search);
  const [prevPageSize, setPrevPageSize] = useState(pageSize);
  if (search !== prevSearch || pageSize !== prevPageSize) {
    setPrevSearch(search);
    setPrevPageSize(pageSize);
    setPage(1);
  }

  const totalPages = meta?.totalPages ?? 1;

  function formatRoleName(role: string): string {
  const normalized = role.trim().toUpperCase();

  switch (normalized) {
    case "ADMIN":
      return "Admin";

    case "EMPLEADO":
      return "Empleado";

    default:
      return (
        normalized.charAt(0) +
        normalized.slice(1).toLowerCase()
      );
  }
}

    const data = useMemo<Colaborador[]>(() => {
      return users.map((user) => ({
        id: user.id,
        nombre: `${user.firstName} ${user.lastName}`.trim(),
        correo: user.email,
        roleId: user.roles[0]?.id ?? "",
        rol:
        user.roles.length > 0
          ? user.roles
              .map((role) => formatRoleName(role.name))
              .join(", ")
          : "Sin rol",
        estado: user.isBlocked
          ? "bloqueado_intento"
          : user.isActive
            ? "activo"
            : "desactivado",
        fecha: new Intl.DateTimeFormat("es-SV").format(
          new Date(user.createdAt),
        ),
      }));
    }, [users]);

  const openDetalle = (colaborador: Colaborador) => setSelectedColaborador(colaborador);
  const closeDetalle = () => setSelectedColaborador(null);

  return {
    data,
    isLoading,
    error,
    refetch,

    searchInput,
    setSearchInput,

    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,

    selected,
    setSelected,

    selectedColaborador,
    openDetalle,
    closeDetalle,
  };
}
