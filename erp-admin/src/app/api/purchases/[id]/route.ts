import type { NextRequest } from "next/server";

import { forwardPurchasesRequest } from "@/lib/purchases-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardPurchasesRequest(`/purchases/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardPurchasesRequest(`/purchases/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return forwardPurchasesRequest(`/purchases/${encodeURIComponent(id)}`, { method: "DELETE" }); }
