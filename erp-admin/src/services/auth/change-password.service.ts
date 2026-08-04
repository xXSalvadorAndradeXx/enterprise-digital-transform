export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ApiErrorResponse {
  message?: string | string[];
}

function getErrorMessage(
  body: ApiErrorResponse | null,
): string {
  if (Array.isArray(body?.message)) {
    return body.message.join(" ");
  }

  if (typeof body?.message === "string") {
    return body.message;
  }

  return "No fue posible cambiar la contraseña.";
}

export async function changePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
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
}
