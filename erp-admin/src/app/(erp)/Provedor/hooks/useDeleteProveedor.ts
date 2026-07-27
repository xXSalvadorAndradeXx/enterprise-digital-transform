import { useState } from "react";
import { deleteProveedor } from "@/services/proveedor/deleteProveedor";

export function useDeleteProveedor() {
  const [loading, setLoading] = useState(false);

  const remove = async (id: string) => {
    setLoading(true);

    try {
      return await deleteProveedor(id);
    } finally {
      setLoading(false);
    }
  };

  return {
    remove,
    loading,
  };
}