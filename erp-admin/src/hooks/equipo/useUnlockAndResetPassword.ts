"use client";

import { useCallback, useState } from "react";

import {
  unlockAndResetPassword as unlockAndResetPasswordService,
  type UnlockAndResetPasswordResponse,
} from "@/services/equipo/unlockAndResetPassword";

interface UseUnlockAndResetPasswordResult {
  unlockAndResetPassword: (
    userId: string,
  ) => Promise<UnlockAndResetPasswordResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUnlockAndResetPassword(): UseUnlockAndResetPasswordResult {
  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const unlockAndResetPassword = useCallback(
    async (
      userId: string,
    ): Promise<UnlockAndResetPasswordResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await unlockAndResetPasswordService(
          userId,
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible desbloquear el usuario y restablecer su contraseña.";

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
    unlockAndResetPassword,
    isLoading,
    error,
    clearError,
  };
}