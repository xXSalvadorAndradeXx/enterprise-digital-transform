export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: {
    id: string;
    name: string;
  }[];
}

export interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getUsers({
  page = 1,
  limit = 10,
  search = "",
}: GetUsersParams = {}): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  const response = await fetch(
    `/api/users?${params.toString()}`,
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const responseBody: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "No hay una sesión activa. Debes autenticarte para consultar los usuarios.",
      );
    }

    throw new Error(
      `No fue posible obtener los usuarios. Código: ${response.status}`,
    );
  }

  return responseBody as UsersResponse;
}