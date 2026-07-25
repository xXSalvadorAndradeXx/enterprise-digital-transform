import { API_BASE_URL } from "@/lib/api";

export async function deleteProveedor(id: string) {
  console.log("ANTES DEL FETCH", id);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/suppliers/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlODI5ZjJmYy1iN2Q5LTRlY2EtYWY5YS02NTA4MjEyOTQ1MmUiLCJlbWFpbCI6ImhlbnJ5QHVnYi5lZHUuc3YiLCJyb2wiOiJBZG1pbiIsImlhdCI6MTc4NDk2MjExMCwiZXhwIjoxNzg0OTY1NzEwfQ.KuLfGFY3XdV19OqBSdf0Ynq8VQC_lJnOvD5At_lpgzs",
      },
    }
  );

  console.log("STATUS:", response.status);
  console.log("OK:", response.ok);

  return {
    status: response.status,
  };
}