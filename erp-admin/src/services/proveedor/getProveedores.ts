import { mockProviders } from "./mockProveedores";

export interface GetProveedoresParams {
  search: string;
  page: number;
  limit: number;
}



export async function getProveedores({
  search,
  page,
  limit,
}: GetProveedoresParams) {
  // Simulamos el tiempo que tardaría una API
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  //throw new Error("Error de prueba");



  const filtered = mockProviders.filter((provider) =>
    provider.provider.toLowerCase().includes(search.toLowerCase())
  );

  const start = (page - 1) * limit;
  const end = start + limit;

  const data = filtered.slice(start, end);

  return {
    data,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}