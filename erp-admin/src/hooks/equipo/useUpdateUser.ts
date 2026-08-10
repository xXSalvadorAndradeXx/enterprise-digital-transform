"use client";

import { useCallback, useState } from "react";

import {
  updateUser as updateUserService,
  type UpdateUserPayload,
  type UpdateUserResponse,
} from "@/services/equipo/updateUser";

interface UseUpdateUserResult {
  updateUser: (
    userId: string,
    payload: UpdateUserPayload,
  ) => Promise<UpdateUserResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUpdateUser(): UseUpdateUserResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback(
    async (
      userId: string,
      payload: UpdateUserPayload,
    ): Promise<UpdateUserResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await updateUserService(userId, payload);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible actualizar el usuario.";

        setError(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateUser,
    isLoading,
    error,
    clearError,
  };
}