import { forwardInventoryRequest } from "@/app/(erp)/inventario/lib/inventory-api";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return forwardInventoryRequest(`/inventory/${id}/details`, {
    method: "GET",
  });
}