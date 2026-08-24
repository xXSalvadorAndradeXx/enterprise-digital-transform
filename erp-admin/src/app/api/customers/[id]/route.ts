import type {
  NextRequest,
} from "next/server";

import {
  forwardBackendResponse,
  getBackendAuthHeaders,
  getBackendUrl,
  unauthorizedResponse,
} from "@/lib/backend-proxy";

import {
  getAuthToken,
} from "@/lib/session";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
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
      await fetch(
        getBackendUrl(
          `/admin/customers/${encodeURIComponent(
            id,
          )}`,
        ),
        {
          method:
            "GET",
          headers:
            await getBackendAuthHeaders({
              contentType:
                null,
            }),
          cache:
            "no-store",
        },
      );

    return forwardBackendResponse(
      response,
    );
  } catch (caughtError) {
    return Response.json(
      {
        statusCode:
          500,
        error:
          "Internal Server Error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo consultar el detalle del cliente.",
      },
      {
        status:
          500,
      },
    );
  }
}
