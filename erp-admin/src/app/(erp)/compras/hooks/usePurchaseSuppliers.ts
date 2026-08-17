"use client";

import { useEffect, useState } from "react";

import { getProveedores } from "@/services/proveedor/getProveedores";
import type { Proveedor } from "@/types/proveedor/proveedor.types";

const SUPPLIERS_PAGE_SIZE = 100;

export interface UsePurchaseSuppliersResult {
  suppliers: readonly Proveedor[];
  loading: boolean;
  error: string | null;
}

export function usePurchaseSuppliers(): UsePurchaseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);

      try {
        const firstPage = await getProveedores({
          search: "",
          page: 1,
          limit: SUPPLIERS_PAGE_SIZE,
        });

        const allSuppliers = [...firstPage.data];

        for (
          let page = 2;
          page <= firstPage.pagination.totalPages;
          page += 1
        ) {
          const result = await getProveedores({
            search: "",
            page,
            limit: SUPPLIERS_PAGE_SIZE,
          });

          allSuppliers.push(...result.data);
        }

        if (!cancelled) {
          setSuppliers(allSuppliers);
        }
      } catch (requestError) {
        if (!cancelled) {
          setSuppliers([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudieron cargar los proveedores.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    suppliers,
    loading,
    error,
  };
}
