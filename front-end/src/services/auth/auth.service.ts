import { apiRequest } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api/api.types";
import type { LoginRequest } from "@/types/auth/auth.types";
import type { Customer } from "@/types/auth/customer.types";
import type { User } from "@/types/auth/user.types";

export type RegisterRequest = {
  nombre: string;
  email: string;
  password: string;
};

export type RegisterResponse = User & {
  createdAt?: string;
};

export type LoginResponse = ApiSuccess<{
  customer: Pick<Customer, "id" | "fullName" | "email">;
  accessToken: string;
  expiresIn: number;
}>;

export function registerUser(data: RegisterRequest) {
  return apiRequest<RegisterResponse, RegisterRequest>("/auth/register", {
    method: "POST",
    body: data,
  });
}

export function loginUser(data: LoginRequest) {
  return apiRequest<LoginResponse, LoginRequest>(
    "/ecommerce/auth/login",
    {
      method: "POST",
      body: data,
    },
  );
}
