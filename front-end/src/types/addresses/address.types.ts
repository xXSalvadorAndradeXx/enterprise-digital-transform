export interface CustomerAddressLocation {
  id: number | string;
  name: string;
}

export interface CustomerAddress {
  id: string;
  department: CustomerAddressLocation | null;
  district: CustomerAddressLocation | null;
  city: string | null;
  addressLine: string;
  label: string;
  phone?: string | null;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  departmentId: string;
  districtId: string;
  city?: string;
  addressLine: string;
  label: string;
  phone: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export interface DeleteAddressResult {
  message: string | null;
}

export type AddressOperation =
  | "create"
  | "update"
  | "delete"
  | "set-primary";
