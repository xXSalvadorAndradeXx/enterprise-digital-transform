interface DeleteProveedorResponse {
  status: number;
}

export async function deleteProveedor(
  id: number
): Promise<DeleteProveedorResponse> {
  // Simula el tiempo de respuesta de la API
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log("Proveedor eliminado:", id);

  return {
    status: 200,
  };
}