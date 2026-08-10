"use client";

import { useCallback, useState } from "react";

import {
  deactivateUsers,
  type BulkActionResult,
} from "@/services/equipo/deactivateUsers";

import { softDeleteUsers } from "@/services/equipo/softDeleteUsers";

interface UseBulkUserActionsResult {
  deactivateSelectedUsers: (
    userIds: string[],
  ) => Promise<BulkActionResult>;

  deleteSelectedUsers: (
    userIds: string[],
  ) => Promise<BulkActionResult>;

  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useBulkUserActions(): UseBulkUserActionsResult {
  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const deactivateSelectedUsers = useCallback(
    async (
      userIds: string[],
    ): Promise<BulkActionResult> => {
      setIsLoading(true);
      setError(null);

      try {
        return await deactivateUsers(userIds);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible desactivar los usuarios.";

        setError(message);
        throw caughtError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteSelectedUsers = useCallback(
    async (
      userIds: string[],
    ): Promise<BulkActionResult> => {
      setIsLoading(true);
      setError(null);

      try {
        return await softDeleteUsers(userIds);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible eliminar los usuarios.";

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
    deactivateSelectedUsers,
    deleteSelectedUsers,
    isLoading,
    error,
    clearError,
  };
}