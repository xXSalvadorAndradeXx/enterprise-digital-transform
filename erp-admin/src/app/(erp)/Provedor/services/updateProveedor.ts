import type { SupplierForm } from "@/lib/validations/supplierSchema";
import { mockProviders } from "@/services/proveedor/mockProveedores";

export async function updateProveedor(
  id: number,
  data: SupplierForm
) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const provider = mockProviders.find((item) => item.id === id);

  if (!provider) {
    return {
      status: 404,
    };
  }

  provider.provider = data.companyName;
  provider.phone = data.phone;

  return {
    status: 200,
    data: provider,
  };
}