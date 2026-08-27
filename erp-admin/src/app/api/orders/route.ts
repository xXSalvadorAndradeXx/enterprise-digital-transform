import type { NextRequest } from "next/server";
import {
  fetchBackendWithAuth,
  forwardBackendResponse,
  getBackendUrl,
} from "@/lib/backend-proxy";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const response = await fetchBackendWithAuth(
      `${getBackendUrl("/admin/orders")}${request.nextUrl.search}`,
      { method: "GET", cache: "no-store" },
    );
    return forwardBackendResponse(response);
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : "No se pudieron cargar las ventas." },
      { status: 500 },
    );
  }
}
