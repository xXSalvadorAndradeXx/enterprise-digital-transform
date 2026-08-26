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

export async function GET(
  request: NextRequest,
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

  try {
    const response =
      await fetchBackendWithAuth(
        `${getBackendUrl(
          "/admin/customers",
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
        statusCode: 500,
        error:
          "Internal Server Error",
        message:
          "No se pudo consultar el listado de clientes.",
      },
      {
        status:
          500,
      },
    );
  }
}
