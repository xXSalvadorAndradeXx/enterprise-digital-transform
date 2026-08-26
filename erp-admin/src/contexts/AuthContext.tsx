"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthUser,
  PublicAuthSession,
} from "@/types/auth/auth.types";

type AuthContextUser = AuthUser & {
  nombre: string;
};

interface AuthContextValue {
  user: AuthContextUser | null;
  mustChangePassword: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  establishSession: (
    session: PublicAuthSession,
  ) => Promise<PublicAuthSession>;
  recoverSession: () => Promise<PublicAuthSession | null>;
  clearSession: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (typeof value.nombre === "undefined" ||
      typeof value.nombre === "string") &&
    typeof value.email === "string" &&
    typeof value.rol === "string" &&
    (typeof value.permissions === "undefined" ||
      (Array.isArray(value.permissions) &&
        value.permissions.every(
          (permission) => typeof permission === "string",
        )))
  );
}

function isPublicAuthSession(value: unknown): value is PublicAuthSession {
  return (
    isRecord(value) &&
    isAuthUser(value.user) &&
    value.isAuthenticated === true &&
    typeof value.mustChangePassword === "boolean"
  );
}

function toAuthContextUser(user: AuthUser): AuthContextUser {
  return {
    ...user,
    nombre: user.nombre ?? user.email,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const recoverSessionPromiseRef =
    useRef<Promise<PublicAuthSession | null> | null>(null);
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setMustChangePassword(false);
  }, []);

  const applyPublicSession = useCallback((session: PublicAuthSession) => {
    setUser(toAuthContextUser(session.user));
    setIsAuthenticated(true);
    setMustChangePassword(session.mustChangePassword);
  }, []);

  const establishSession = useCallback(
    async (session: PublicAuthSession) => {
      if (!isPublicAuthSession(session)) {
        clearAuthState();
        throw new Error("No se pudo establecer la sesión.");
      }

      applyPublicSession(session);
      setIsInitializing(false);

      return session;
    },
    [applyPublicSession, clearAuthState],
  );

  const recoverSession = useCallback(() => {
    if (recoverSessionPromiseRef.current) {
      return recoverSessionPromiseRef.current;
    }

    recoverSessionPromiseRef.current = (async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
        });

        if (sessionResponse.status === 401) {
          clearAuthState();
          return null;
        }

        if (!sessionResponse.ok) {
          clearAuthState();
          return null;
        }

        const sessionBody: unknown = await sessionResponse.json();

        if (!isPublicAuthSession(sessionBody)) {
          clearAuthState();
          return null;
        }

        applyPublicSession(sessionBody);

        return sessionBody;
      } catch {
        clearAuthState();
        return null;
      } finally {
        setIsInitializing(false);
        recoverSessionPromiseRef.current = null;
      }
    })();

    return recoverSessionPromiseRef.current;
  }, [applyPublicSession, clearAuthState]);

  const clearSession = useCallback(async () => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      // El logout real aun no existe en Backend; limpiar estado local basta.
    } finally {
      clearAuthState();
      setIsInitializing(false);
    }
  }, [clearAuthState]);

  useEffect(() => {
    void recoverSession();
  }, [recoverSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      mustChangePassword,
      isAuthenticated,
      isInitializing,
      establishSession,
      recoverSession,
      clearSession,
    }),
    [
      user,
      mustChangePassword,
      isAuthenticated,
      isInitializing,
      establishSession,
      recoverSession,
      clearSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
