import { NextRequest } from "next/server";

import { forwardInventoryRequest } from "@/app/(erp)/inventario/lib/inventory-api";

export async function GET(request: NextRequest) {
  return forwardInventoryRequest(
    `/inventory/movements${request.nextUrl.search}`,
    {
      method: "GET",
    },
  );
}
