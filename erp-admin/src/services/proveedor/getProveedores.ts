import { API_BASE_URL } from "@/lib/api";

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
  console.log("Entró a getProveedores");
  const response = await fetch(
    
    `${API_BASE_URL}/api/v1/suppliers?search=${search}&page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
  "Content-Type": "application/json",
  Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlODI5ZjJmYy1iN2Q5LTRlY2EtYWY5YS02NTA4MjEyOTQ1MmUiLCJlbWFpbCI6ImhlbnJ5QHVnYi5lZHUuc3YiLCJyb2wiOiJBZG1pbiIsImlhdCI6MTc4NDk2MjExMCwiZXhwIjoxNzg0OTY1NzEwfQ.KuLfGFY3XdV19OqBSdf0Ynq8VQC_lJnOvD5At_lpgzs",
},
    }
  );
  console.log(response.status);

  if (!response.ok) {
  console.log("STATUS:", response.status);
  console.log(await response.text());
  throw new Error("Error al obtener proveedores");
}

const result = await response.json();

console.log("RESULTADO DEL BACKEND:");
console.log(result);

return {
  data: result.data.map((supplier: any) => ({
    id: supplier.id,
    provider: supplier.name,
    phone: supplier.phone,
  })),
  pagination: result.meta,
};
}