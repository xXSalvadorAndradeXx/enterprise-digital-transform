import type {
  LoginRequest,
  RegisterRequest,
} from "@/types/auth/auth.types";
import type { Customer } from "@/types/auth/customer.types";

export const mockLoginCredentials = {
  email: "cliente@woden.com",
  password: "Segura#2026Ab",
} satisfies Pick<LoginRequest, "email" | "password">;

export const mockCustomer: Customer = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Cliente Woden",
  dui: "12345678-9",
  email: mockLoginCredentials.email,
  phone: "70000000",
};

export const mockDuplicateRegistration = {
  email: "registrado@woden.com",
  dui: "87654321-0",
} as const;

export const mockAccessToken =
  "mock-access-token-task-816-not-for-production";

export const mockAccessTokenExpiresIn = 900;

export function createMockCustomer(request: RegisterRequest): Customer {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: request.fullName,
    dui: request.dui,
    email: request.email,
    phone: request.phone,
  };
}
