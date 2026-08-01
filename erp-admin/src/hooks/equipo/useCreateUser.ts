"use client";

import { useState } from "react";

import {
  createUser as createUserService,
  type CreateUserPayload,
  type CreateUserResponse,
} from "@/services/equipo/createUser";

interface UseCreateUserResult {
  createUser: (
    payload: CreateUserPayload,
  ) => Promise<CreateUserResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateUser(): UseCreateUserResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (
    payload: CreateUserPayload,
  ): Promise<CreateUserResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      return await createUserService(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible crear el usuario.";

      setError(message);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    createUser,
    isLoading,
    error,
    clearError,
  };
}