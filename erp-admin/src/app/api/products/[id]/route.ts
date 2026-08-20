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

interface ProductRouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/products/:id (detalle administrativo, incluye borradores)
 */
export async function GET(
  _request: NextRequest,
  context:
    ProductRouteContext,
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
    const response =
      await fetch(
        getBackendUrl(
          `/products/admin/${id}`,
        ),
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
  } catch {
    return Response.json(
      {
        statusCode: 500,
        error:
          "Internal Server Error",
        message:
          "No se pudo consultar el producto.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH /api/products/:id
 */
export async function PATCH(
  request: NextRequest,
  context:
    ProductRouteContext,
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
          `/products/${id}`,
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
          "No se pudo actualizar el producto.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE /api/products/:id
 */
export async function DELETE(
  _request: NextRequest,
  context:
    ProductRouteContext,
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
    const response =
      await fetch(
        getBackendUrl(
          `/products/${id}`,
        ),
        {
          method:
            "DELETE",

          headers:
            await getBackendAuthHeaders(),
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
          "No se pudo eliminar el producto.",
      },
      {
        status: 500,
      },
    );
  }
}
