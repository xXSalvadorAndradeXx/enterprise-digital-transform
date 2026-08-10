export interface BulkActionResult {
  successfulIds: string[];
  failedIds: string[];
}

export async function softDeleteUsers(
  userIds: string[],
): Promise<BulkActionResult> {
  if (userIds.length === 0) {
    throw new Error(
      "Debes seleccionar al menos un usuario.",
    );
  }

  const results = await Promise.allSettled(
    userIds.map(async (userId) => {

      // ← ESTE ES EL CÓDIGO QUE TE PASÉ
      const response = await fetch(
        `/api/users/${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const responseBody = await response
          .json()
          .catch(() => null);

        const message =
          Array.isArray(responseBody?.message)
            ? responseBody.message.join(", ")
            : typeof responseBody?.message === "string"
              ? responseBody.message
              : "No fue posible eliminar el usuario.";

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