import {
  ApiRequestError,
  apiRequest,
  apiRequestWithResponse,
} from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type { ApiSuccess } from "@/types/api/api.types";
import type {
  CreateAddressRequest,
  CustomerAddress,
  CustomerAddressLocation,
  DeleteAddressResult,
  UpdateAddressRequest,
} from "@/types/addresses/address.types";

const ADDRESSES_API_PATH = "/customers/me/addresses";

type ApiAddressMutationSuccess<T> = ApiSuccess<T> & {
  message?: string;
};

function getRequiredCustomerHeaders(): Record<string, string> {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Se requiere una sesion activa para gestionar direcciones.",
      401,
      null,
      "UNAUTHORIZED",
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeAddressLocation(
  value: unknown,
): CustomerAddressLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id:
      typeof value.id === "number"
        ? value.id
        : String(value.id ?? ""),
    name: String(value.name ?? ""),
  };
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function normalizeAddress(value: unknown): CustomerAddress {
  if (!isRecord(value)) {
    throw new Error("ADDRESSES_RESPONSE_ERROR");
  }

  return {
    id: String(value.id ?? ""),
    department: normalizeAddressLocation(value.department),
    district: normalizeAddressLocation(value.district),
    city: normalizeNullableString(value.city),
    addressLine: String(value.addressLine ?? ""),
    label: String(value.label ?? ""),
    isDefault: value.isDefault === true,
  };
}

function normalizeAddresses(value: unknown): CustomerAddress[] {
  if (!Array.isArray(value)) {
    throw new Error("ADDRESSES_RESPONSE_ERROR");
  }

  return value.map(normalizeAddress);
}

function getResponseMessage(value: unknown): string | null {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : null;
}

export async function getAddresses(
  signal?: AbortSignal,
): Promise<CustomerAddress[]> {
  const response = await apiRequest<ApiSuccess<unknown>>(
    ADDRESSES_API_PATH,
    {
      headers: getRequiredCustomerHeaders(),
      signal,
    },
  );

  return normalizeAddresses(response.data);
}

export async function createAddress(
  data: CreateAddressRequest,
  signal?: AbortSignal,
): Promise<CustomerAddress> {
  const response = await apiRequest<
    ApiSuccess<unknown>,
    CreateAddressRequest
  >(ADDRESSES_API_PATH, {
    method: "POST",
    body: data,
    headers: getRequiredCustomerHeaders(),
    signal,
  });

  return normalizeAddress(response.data);
}

export async function updateAddress(
  addressId: string,
  data: UpdateAddressRequest,
  signal?: AbortSignal,
): Promise<CustomerAddress> {
  const response = await apiRequest<
    ApiSuccess<unknown>,
    UpdateAddressRequest
  >(`${ADDRESSES_API_PATH}/${encodeURIComponent(addressId)}`, {
    method: "PATCH",
    body: data,
    headers: getRequiredCustomerHeaders(),
    signal,
  });

  return normalizeAddress(response.data);
}

export async function deleteAddress(
  addressId: string,
  signal?: AbortSignal,
): Promise<DeleteAddressResult> {
  const response = await apiRequestWithResponse<
    ApiAddressMutationSuccess<unknown> | null
  >(`${ADDRESSES_API_PATH}/${encodeURIComponent(addressId)}`, {
    method: "DELETE",
    headers: getRequiredCustomerHeaders(),
    signal,
  });

  return {
    message: getResponseMessage(response.data),
  };
}

export async function setDefaultAddress(
  addressId: string,
  signal?: AbortSignal,
): Promise<CustomerAddress> {
  const response = await apiRequest<ApiSuccess<unknown>>(
    `${ADDRESSES_API_PATH}/${encodeURIComponent(addressId)}/default`,
    {
      method: "PATCH",
      headers: getRequiredCustomerHeaders(),
      signal,
    },
  );

  return normalizeAddress(response.data);
}

export const addressService = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
