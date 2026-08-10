interface GenerateTemporaryPasswordResponse {
  status: string;
  message: string;
  temporaryPassword: string;
}

interface ApiErrorResponse {
  message?: string | string[];
}

function getErrorMessage(
  responseBody: ApiErrorResponse | null,
): string {
  if (Array.isArray(responseBody?.message)) {
    return responseBody.message.join(", ");
  }

  return (
    responseBody?.message ??
    "No fue posible generar la contraseña temporal."
  );
}

export async function generateTemporaryPassword(
  userId: string,
): Promise<GenerateTemporaryPasswordResponse> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(
      userId,
    )}/generate-temporary-password`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const responseBody =
    (await response.json().catch(() => null)) as
      | GenerateTemporaryPasswordResponse
      | ApiErrorResponse
      | null;

  if (!response.ok) {
    throw new Error(
      getErrorMessage(responseBody as ApiErrorResponse | null),
    );
  }

  return responseBody as GenerateTemporaryPasswordResponse;
}