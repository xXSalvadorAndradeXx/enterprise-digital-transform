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

export async function POST(
  request: NextRequest,
): Promise<Response> {
  const token =
    await getAuthToken();

  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const formData =
      await request.formData();

    /**
     * No establecemos Content-Type.
     *
     * fetch generará automáticamente:
     *
     * multipart/form-data; boundary=...
     */
    const headers =
      await getBackendAuthHeaders({
        contentType:
          null,
      });

    const response =
      await fetch(
        getBackendUrl(
          "/products/upload-image",
        ),
        {
          method:
            "POST",

          headers,

          body:
            formData,
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
          "No se pudo subir la imagen del producto.",
      },
      {
        status: 500,
      },
    );
  }
}