"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SelectOption } from "@/components/ui/Select";
import {
  getRoles,
  type RoleCatalogItem,
} from "@/services/equipo/getRoles";

const ASSIGNABLE_ROLE_NAMES = new Set([
  "ADMIN",
  "EMPLEADO",
]);

function formatRoleLabel(name: string): string {
  const normalizedName = name.trim().toUpperCase();

  if (normalizedName === "ADMIN") {
    return "Administrador";
  }

  if (normalizedName === "EMPLEADO") {
    return "Empleado";
  }

  return name;
}

export function useRoles() {
  const [roles, setRoles] = useState<RoleCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const roleCatalog = await getRoles();
      setRoles(roleCatalog);
    } catch (requestError) {
      setRoles([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible obtener el catálogo de roles.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    getRoles()
      .then((roleCatalog) => {
        if (!isCancelled) {
          setRoles(roleCatalog);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!isCancelled) {
          setRoles([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible obtener el catálogo de roles.",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const options = useMemo<SelectOption[]>(
    () =>
      roles
        .filter((role) =>
          ASSIGNABLE_ROLE_NAMES.has(
            role.name.trim().toUpperCase(),
          ),
        )
        .map((role) => ({
          value: role.id,
          label: formatRoleLabel(role.name),
        })),
    [roles],
  );

  return {
    roles,
    options,
    isLoading,
    error,
    refetch,
  };
}
