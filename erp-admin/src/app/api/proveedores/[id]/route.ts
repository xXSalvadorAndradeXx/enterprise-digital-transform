import { type NextRequest } from "next/server";

import { forwardSuppliersRequest } from "@/lib/proveedores-api";

interface ProveedorRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: ProveedorRouteContext,
) {
  const { id } = await context.params;

  return forwardSuppliersRequest(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
}

export async function DELETE(
  _request: NextRequest,
  context: ProveedorRouteContext,
) {
  const { id } = await context.params;

  return forwardSuppliersRequest(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
