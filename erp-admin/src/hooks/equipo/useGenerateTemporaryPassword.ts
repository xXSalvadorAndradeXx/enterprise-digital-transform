"use client";

import { useCallback, useState } from "react";

import { generateTemporaryPassword } from "@/services/equipo/generateTemporaryPassword";

interface UseGenerateTemporaryPasswordReturn {
  generatePassword: (
    userId: string,
  ) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGenerateTemporaryPassword(): UseGenerateTemporaryPasswordReturn {
  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const generatePassword = useCallback(
    async (
      userId: string,
    ): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await generateTemporaryPassword(userId);

        return response.temporaryPassword;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible generar la contraseña temporal.";

        setError(message);
        return null;
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
    generatePassword,
    isLoading,
    error,
    clearError,
  };
}