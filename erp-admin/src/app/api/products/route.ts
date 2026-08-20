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

/**
 * GET /api/products
 *
 * Proxy hacia:
 * GET /api/v1/products/admin
 *
 * Esta pantalla es administrativa y debe incluir borradores. El endpoint
 * público /products fuerza status=ACTIVE y ocultaba productos recién creados.
 */
export async function GET(
  request: NextRequest,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
  }

  const search =
    request.nextUrl.search;

  try {
    const response =
      await fetch(
        `${getBackendUrl(
          "/products/admin",
        )}${search}`,
        {
          method:
            "GET",

          headers:
            await getBackendAuthHeaders(),

          cache:
            "no-store",
        },
      );

    return forwardBackendResponse(
      response,
    );
  } catch (caughtError) {
  console.error(
    "[Products BFF] Error GET /api/products:",
    caughtError,
  );

  return Response.json(
    {
      statusCode: 500,
      error: "Internal Server Error",
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo consultar el catálogo de productos.",
    },
    {
      status: 500,
    },
  );
}
}

/**
 * POST /api/products
 *
 * Proxy hacia:
 * POST /api/v1/products
 */
export async function POST(
  request: NextRequest,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const body =
      await request.text();

    const response =
      await fetch(
        getBackendUrl(
          "/products",
        ),
        {
          method:
            "POST",

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
          "No se pudo crear el producto.",
      },
      {
        status: 500,
      },
    );
  }
}
