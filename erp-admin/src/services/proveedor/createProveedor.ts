import type { SupplierForm } from "@/lib/validations/supplierSchema";
import type { ProveedorMutationResponse } from "@/types/proveedor/proveedor.types";

import { requestProveedores } from "./proveedor-api";

export async function createProveedor(
  data: SupplierForm,
): Promise<ProveedorMutationResponse> {
  const localPhone = data.phone.replace(/\D/g, "").slice(-8);

  const { response, body } = await requestProveedores(
    "/api/proveedores",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.companyName,
        phone: `+503${localPhone}`,
      }),
    },
  );

  return {
    status: response.status,
    data: body,
  };
}
