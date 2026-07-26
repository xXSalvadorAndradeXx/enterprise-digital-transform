import { useState } from "react";
import type { SupplierForm } from "@/lib/validations/supplierSchema";
import { createProveedor } from "@/services/proveedor/createProveedor";

export function useCreateProveedor() {
  const [loading, setLoading] = useState(false);

  const create = async (data: SupplierForm) => {
    try {
      setLoading(true);

      const response = await createProveedor(data);

      return response;
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    loading,
  };
}