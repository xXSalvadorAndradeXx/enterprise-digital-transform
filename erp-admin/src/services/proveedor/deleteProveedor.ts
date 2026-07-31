import { requestProveedores } from "./proveedor-api";

export async function deleteProveedor(
  id: string,
): Promise<{ status: number }> {
  const { response } = await requestProveedores(
    `/api/proveedores/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  return {
    status: response.status,
  };
}
