import { apiRequest } from "@/lib/api-client";
import type { User } from "@/types/auth/user.types";

export type RegisterRequest = {
  nombre: string;
  email: string;
  password: string;
};

export type RegisterResponse = User & {
  createdAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    access_token: string;
    refresh_token: string;
    user: User;
    mustChangePassword?: boolean;
    must_change_password?: boolean;
  };
};

export function registerUser(data: RegisterRequest) {
  return apiRequest<RegisterResponse, RegisterRequest>("/auth/register", {
    method: "POST",
    body: data,
  });
}

export function loginUser(data: LoginRequest) {
  return apiRequest<LoginResponse, LoginRequest>("/auth/login", {
    method: "POST",
    body: data,
  });
}
