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
  departmentId: string;
  districtId: string;
  city: string;
  addressLine: string;
}

export type RegisterRequest = RegisterPersonalStep &
  RegisterCredentialsStep &
  RegisterAddressStep;
