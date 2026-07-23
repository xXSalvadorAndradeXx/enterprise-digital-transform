import type { SupplierForm } from "@/lib/validations/supplierSchema";
import { mockProviders } from "@/services/proveedor/mockProveedores";

export async function createProveedor(data: SupplierForm) {
  await new Promise((resolve) => setTimeout(resolve, 800));

const exists = mockProviders.some(
  (provider) =>
    provider.provider.toLowerCase() ===
    data.companyName.toLowerCase()
);

if (exists) {
  return {
    status: 409,
    errors: {
      companyName: "Este proveedor ya existe.",
    },
  };
}

  mockProviders.unshift({
    id: Date.now(),
    provider: data.companyName,
    phone: data.phone,
  });

  return {
    status: 201,
    data,
  };
}