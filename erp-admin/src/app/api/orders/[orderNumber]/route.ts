import type { NextRequest } from "next/server";
import {
  fetchBackendWithAuth,
  forwardBackendResponse,
  getBackendUrl,
} from "@/lib/backend-proxy";

interface RouteContext {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  const { orderNumber } = await context.params;
  const response = await fetchBackendWithAuth(
    getBackendUrl(`/admin/orders/${encodeURIComponent(orderNumber)}`),
    { method: "GET", cache: "no-store" },
  );
  return forwardBackendResponse(response);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  const { orderNumber } = await context.params;
  const response = await fetchBackendWithAuth(
    getBackendUrl(`/admin/orders/${encodeURIComponent(orderNumber)}/status`),
    { method: "PATCH", body: await request.text() },
  );
  return forwardBackendResponse(response);
}
