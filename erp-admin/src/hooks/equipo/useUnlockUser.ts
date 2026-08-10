"use client";

import { useCallback, useState } from "react";

import {
  unlockUser as unlockUserService,
  type UnlockUserResponse,
} from "@/services/equipo/unlockUser";

interface UseUnlockUserResult {
  unlockUser: (
    userId: string,
  ) => Promise<UnlockUserResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUnlockUser(): UseUnlockUserResult {
  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const unlockUser = useCallback(
    async (
      userId: string,
    ): Promise<UnlockUserResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await unlockUserService(userId);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible desbloquear el usuario.";

        setError(message);
        throw caughtError;
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
    unlockUser,
    isLoading,
    error,
    clearError,
  };
}