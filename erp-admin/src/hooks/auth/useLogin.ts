"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { login as loginService } from "@/services/auth/auth.service";
import {
  AuthServiceError,
  type AuthError,
  type LoginRequest,
  type PublicAuthSession,
} from "@/types/auth/auth.types";

interface UseLoginResult {
  login: (request: LoginRequest) => Promise<PublicAuthSession | null>;
  isLoading: boolean;
  isSuccess: boolean;
  error: AuthError | null;
  resetError: () => void;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function normalizeAuthError(error: unknown): AuthError {
  if (error instanceof AuthServiceError) {
    return {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return {
    type: "unknown",
    message: "No se pudo completar la solicitud de autenticación.",
  };
}

export function useLogin(): UseLoginResult {
  const isMountedRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      requestInProgressRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, []);

  const resetError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    if (requestInProgressRef.current) {
      return null;
    }

    requestInProgressRef.current = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;

    if (isMountedRef.current) {
      setIsLoading(true);
      setIsSuccess(false);
      setError(null);
    }

    try {
      const response = await loginService(request, {
        signal: controller.signal,
      });

      if (!isMountedRef.current) {
        return null;
      }

      setIsSuccess(true);
      return response;
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return null;
      }

      if (isAbortError(caughtError)) {
        return null;
      }

      const nextError = normalizeAuthError(caughtError);
      setError(nextError);
      setIsSuccess(false);

      return null;
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }

      requestInProgressRef.current = false;

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    login,
    isLoading,
    isSuccess,
    error,
    resetError,
  };
}
