import { unwrapApiSuccess } from "@/lib/api-response";

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UpdatedUserRole {
  id: string;
  name: string;
  description?: string;
}

export interface UpdatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  roles: UpdatedUserRole[];
}

export interface UpdateUserResponse {
  status: string;
  message: string;
  data: UpdatedUser;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function getErrorMessage(
  response: ApiErrorResponse | null,
): string {
  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }

  if (typeof response?.message === "string") {
    return response.message;
  }

  return "No fue posible actualizar el usuario.";
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<UpdateUserResponse> {
  if (!userId.trim()) {
    throw new Error(
      "El identificador del usuario es obligatorio.",
    );
  }

  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  let responseBody:
    | UpdateUserResponse
    | ApiErrorResponse
    | null = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseBody as ApiErrorResponse | null,
      ),
    );
  }

  responseBody = unwrapApiSuccess<UpdateUserResponse | null>(responseBody);

  if (
    !responseBody ||
    !("data" in responseBody)
  ) {
    throw new Error(
      "El servidor devolvió una respuesta inválida.",
    );
  }

  return responseBody as UpdateUserResponse;
}
