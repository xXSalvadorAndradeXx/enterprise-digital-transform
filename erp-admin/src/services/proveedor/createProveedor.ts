import { API_BASE_URL } from "@/lib/api";

export async function createProveedor(data: any) {

  console.log("ENTRÓ A createProveedor");
 
  const body = {
  name: data.companyName,
  phone: data.phone.replace("+503 ", ""),
};

console.log(body);
  

  const response = await fetch(
    `${API_BASE_URL}/api/v1/suppliers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlODI5ZjJmYy1iN2Q5LTRlY2EtYWY5YS02NTA4MjEyOTQ1MmUiLCJlbWFpbCI6ImhlbnJ5QHVnYi5lZHUuc3YiLCJyb2wiOiJBZG1pbiIsImlhdCI6MTc4NDk2MjExMCwiZXhwIjoxNzg0OTY1NzEwfQ.KuLfGFY3XdV19OqBSdf0Ynq8VQC_lJnOvD5At_lpgzs",
      },
      body: JSON.stringify(body),
    }
  );

  

  const result = await response.json();


  return {
    status: response.status,
    data: result,
  };
}