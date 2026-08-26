import { unwrapApiSuccess } from "@/lib/api-response";

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
  isBlocked: boolean;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  roles: {
    id: string;
    name: string;
    description?: string | null;
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
        throw new UsersRequestError(
          response.status,
          getResponseMessage(responseBody),
        );
      }

      return unwrapApiSuccess<UsersResponse>(responseBody);
}

export class UsersRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UsersRequestError";
  }
}

function getResponseMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body
  ) {
    const message = body.message;

    if (Array.isArray(message)) {
      return message
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "No fue posible consultar los usuarios.";
}
