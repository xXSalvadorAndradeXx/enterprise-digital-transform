import type {
  NextRequest,
} from "next/server";

import {
  getBackendAuthHeaders,
  getBackendUrl,
  forwardBackendResponse,
  unauthorizedResponse,
} from "@/lib/backend-proxy";

import {
  getAuthToken,
} from "@/lib/session";

interface ProductStatusRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context:
    ProductStatusRouteContext,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
  }

  const {
    id,
  } =
    await context.params;

  try {
    const body =
      await request.text();

    const response =
      await fetch(
        getBackendUrl(
          `/products/${id}/status`,
        ),
        {
          method:
            "PATCH",

          headers:
            await getBackendAuthHeaders(),

          body,
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
          "No se pudo cambiar el estado del producto.",
      },
      {
        status: 500,
      },
    );
  }
}