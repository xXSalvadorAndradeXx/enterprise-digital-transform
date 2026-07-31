import { type NextRequest } from "next/server";

import { forwardSuppliersRequest } from "@/lib/proveedores-api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.search;

  return forwardSuppliersRequest(query, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  return forwardSuppliersRequest("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
}
