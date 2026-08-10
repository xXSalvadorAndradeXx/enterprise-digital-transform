export interface BulkActionResult {
  successfulIds: string[];
  failedIds: string[];
}

export async function deactivateUsers(
  userIds: string[],
): Promise<BulkActionResult> {
  if (userIds.length === 0) {
    throw new Error(
      "Debes seleccionar al menos un usuario.",
    );
  }

  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const response = await fetch(
        `/api/users/${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: false,
          }),
        },
      );

      const responseBody = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          typeof responseBody?.message === "string"
            ? responseBody.message
            : "No fue posible desactivar el usuario.";

        throw new Error(message);
      }

      return userId;
    }),
  );

  const successfulIds: string[] = [];
  const failedIds: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulIds.push(result.value);
    } else {
      failedIds.push(userIds[index]);
    }
  });

  return {
    successfulIds,
    failedIds,
  };
}