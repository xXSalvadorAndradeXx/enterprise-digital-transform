import { useEffect, useState } from "react";
import { getProveedores } from "@/services/proveedor/getProveedores";

export function useProveedores(
  search: string,
  page: number,
  limit: number = 10
) {
  const [providers, setProviders] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadProviders() {
      try {
        setLoading(true);
        setError(false);

        const response = await getProveedores({
          search,
          page,
          limit,
        });

        setProviders(response.data);
        setPagination(response.pagination);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, [search, page, limit]);

  const isEmpty =
  !loading &&
  providers.length === 0 &&
  search.trim() === "";

const isNoResults =
  !loading &&
  providers.length === 0 &&
  search.trim() !== "";
  return {
  providers,
  pagination,
  loading,
  error,
  isEmpty,
  isNoResults,
};
}