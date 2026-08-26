import { unwrapApiSuccess } from "@/lib/api-response";

export interface UnlockedUserRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface UnlockedUser {
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
  roles: UnlockedUserRole[];
}

export interface UnlockUserResponse {
  status: string;
  message: string;
  data: UnlockedUser;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function getErrorMessage(
  responseBody: ApiErrorResponse | null,
): string {
  if (Array.isArray(responseBody?.message)) {
    return responseBody.message.join(", ");
  }

  if (typeof responseBody?.message === "string") {
    return responseBody.message;
  }

  return "No fue posible desbloquear el usuario.";
}

export async function unlockUser(
  userId: string,
): Promise<UnlockUserResponse> {
  if (!userId.trim()) {
    throw new Error(
      "El identificador del usuario es obligatorio.",
    );
  }

  const response = await fetch(
    `/api/users/${encodeURIComponent(userId)}/unlock`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const responseBody:
    | UnlockUserResponse
    | ApiErrorResponse
    | null = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseBody as ApiErrorResponse | null,
      ),
    );
  }

  const normalizedBody = unwrapApiSuccess<UnlockUserResponse | null>(
    responseBody,
  );

  if (
    !normalizedBody ||
    !("data" in normalizedBody)
  ) {
    throw new Error(
      "El servidor devolvió una respuesta inválida.",
    );
  }

  return normalizedBody;
}
