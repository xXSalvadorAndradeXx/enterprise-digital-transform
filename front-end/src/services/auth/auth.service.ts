import { apiRequest } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api/api.types";
import type { LoginRequest, RegisterRequest } from "@/types/auth/auth.types";
import type { Customer } from "@/types/auth/customer.types";

export type AuthResponse = ApiSuccess<{
  customer: Customer;
  accessToken: string;
  expiresIn: number;
}>;

export function registerUser(data: RegisterRequest) {
  return apiRequest<AuthResponse, RegisterRequest>(
    "/ecommerce/auth/register",
    { method: "POST", body: data },
  );
}

export function loginUser(data: LoginRequest) {
  return apiRequest<AuthResponse, LoginRequest>(
    "/ecommerce/auth/login",
    {
      method: "POST",
      body: data,
    },
  );
}
