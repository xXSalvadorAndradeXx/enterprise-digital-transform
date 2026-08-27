export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPersonalStep {
  fullName: string;
  dui: string;
  phone: string;
}

export interface RegisterCredentialsStep {
  email: string;
  password: string;
}

export interface RegisterAddressStep {
  departmentId: number;
  districtId: number;
  city: string;
  addressLine: string;
}

export type RegisterRequest = RegisterPersonalStep &
  RegisterCredentialsStep &
  RegisterAddressStep;

export type RegisterFormValues = Omit<
  RegisterRequest,
  "departmentId" | "districtId"
> & {
  departmentId: number | null;
  districtId: number | null;
};
