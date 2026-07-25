import { useState } from "react";
import type { SupplierForm } from "@/lib/validations/supplierSchema";
import { updateProveedor } from "@/services/proveedor/updateProveedor";

export function useUpdateProveedor() {
  const [loading, setLoading] = useState(false);

 const update = async (id: string, data: SupplierForm) => {
  
  try {
    setLoading(true);

    const response = await updateProveedor(id, data);

    

    return response;
  } finally {
    setLoading(false);
  }
};
  return {
    update,
    loading,
  };
}