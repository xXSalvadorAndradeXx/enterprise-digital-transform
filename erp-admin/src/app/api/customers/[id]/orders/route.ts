import type {
  NextRequest,
} from "next/server";

import {
  fetchBackendWithAuth,
  forwardBackendResponse,
  getBackendUrl,
  unauthorizedResponse,
} from "@/lib/backend-proxy";

import {
  getAuthToken,
  refreshAuthToken,
} from "@/lib/session";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    const refreshed =
      await refreshAuthToken();

    if (!refreshed) {
      return unauthorizedResponse();
    }
  }

  const {
    id,
  } = await context.params;

  if (!id) {
    return Response.json(
      {
        statusCode:
          400,
        error:
          "Bad Request",
        message:
          "El identificador del cliente es obligatorio.",
      },
      {
        status:
          400,
      },
    );
  }

  try {
    const response =
      await fetchBackendWithAuth(
        `${getBackendUrl(
          `/admin/customers/${encodeURIComponent(
            id,
          )}/orders`,
        )}${request.nextUrl.search}`,
        {
          method:
            "GET",
          cache:
            "no-store",
        },
        {
          contentType:
            null,
        },
      );

    return forwardBackendResponse(
      response,
    );
  } catch {
    return Response.json(
      {
        statusCode:
          500,
        error:
          "Internal Server Error",
        message:
          "No se pudo consultar el historial de pedidos del cliente.",
      },
      {
        status:
          500,
      },
    );
  }
}
