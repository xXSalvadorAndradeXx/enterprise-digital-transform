export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface UpdateCustomerProfileRequest {
  name: string;
  phone: string;
}
