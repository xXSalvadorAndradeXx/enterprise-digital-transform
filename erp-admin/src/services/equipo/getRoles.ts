export interface RoleCatalogItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface RolesApiResponse {
  status: string;
  message: string;
  data: RoleCatalogItem[];
}

interface ApiErrorResponse {
  message?: string | string[];
}

function getErrorMessage(
  response: ApiErrorResponse | null,
): string {
  if (Array.isArray(response?.message)) {
    return response.message.join(" ");
  }

  if (typeof response?.message === "string") {
    return response.message;
  }

  return "No fue posible obtener el catálogo de roles.";
}

export async function getRoles(): Promise<RoleCatalogItem[]> {
  const response = await fetch("/api/roles", {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const responseBody: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseBody as ApiErrorResponse | null,
      ),
    );
  }

  if (
    typeof responseBody !== "object" ||
    responseBody === null ||
    !("data" in responseBody) ||
    !Array.isArray(responseBody.data)
  ) {
    throw new Error(
      "El servidor devolvió un catálogo de roles inválido.",
    );
  }

  return (responseBody as RolesApiResponse).data;
}
