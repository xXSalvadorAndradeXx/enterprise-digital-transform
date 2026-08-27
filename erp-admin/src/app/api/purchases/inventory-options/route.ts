import type { NextRequest } from "next/server";
import { forwardPurchasesRequest } from "@/lib/purchases-api";

export async function GET(request: NextRequest) {
  return forwardPurchasesRequest(
    `/purchases/inventory-options${request.nextUrl.search}`,
    { method: "GET" },
  );
}
