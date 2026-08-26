export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nombre?: string;
  email: string;
  rol: string;
  permissions?: string[];
}

export interface PublicAuthSession {
  user: AuthUser;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}

export type AuthErrorType =
  | "validation"
  | "user_not_registered"
  | "incorrect_password"
  | "invalid_credentials"
  | "user_inactive"
  | "account_locked"
  | "network"
  | "timeout"
  | "server"
  | "unauthorized"
  | "unknown";

export interface AuthError {
  type: AuthErrorType;
  message: string;
  statusCode?: number;
}

export class AuthServiceError extends Error {
  readonly type: AuthErrorType;
  readonly statusCode?: number;

  constructor(type: AuthErrorType, message: string, statusCode?: number) {
    super(message);
    this.name = "AuthServiceError";
    this.type = type;
    this.statusCode = statusCode;
  }
}
