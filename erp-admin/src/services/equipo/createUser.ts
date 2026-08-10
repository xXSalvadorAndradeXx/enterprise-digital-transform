export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  roleIds: string[];
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface CreatedUser {
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
  roles: UserRole[];
}

export interface CreateUserResponse {
  status: string;
  message: string;
  data: CreatedUser;
  temporaryPassword: string;
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

  return "No fue posible crear el usuario.";
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<CreateUserResponse> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let responseBody:
    | CreateUserResponse
    | ApiErrorResponse
    | null = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(responseBody as ApiErrorResponse | null),
    );
  }

  if (
    !responseBody ||
    !("data" in responseBody)
  ) {
    throw new Error(
      "El servidor devolvió una respuesta inválida.",
    );
  }

  return responseBody as CreateUserResponse;
}