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

export async function GET(
  request: NextRequest,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const response =
      await fetch(
        `${getBackendUrl(
          "/admin/customers",
        )}${request.nextUrl.search}`,
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
        statusCode: 500,
        error:
          "Internal Server Error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo consultar el listado de clientes.",
      },
      {
        status:
          500,
      },
    );
  }
}
