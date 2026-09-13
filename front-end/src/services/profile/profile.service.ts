import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { readAccessToken } from "@/lib/auth-session";
import type { ApiSuccess } from "@/types/api/api.types";
import type {
  CustomerProfile,
  UpdateCustomerProfileRequest,
} from "@/types/profile/profile.types";

const CUSTOMER_PROFILE_PATH = "/customers/me";

export async function getCustomerProfile(
  signal?: AbortSignal,
): Promise<CustomerProfile> {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Se requiere una sesión activa para consultar el perfil.",
      401,
      null,
    );
  }

  const response = await apiRequest<ApiSuccess<CustomerProfile>>(
    CUSTOMER_PROFILE_PATH,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    },
  );

  return response.data;
}

export async function updateCustomerProfile(
  payload: UpdateCustomerProfileRequest,
  signal?: AbortSignal,
): Promise<CustomerProfile> {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new ApiRequestError(
      "Se requiere una sesión activa para actualizar el perfil.",
      401,
      null,
    );
  }

  const response = await apiRequest<
    ApiSuccess<CustomerProfile>,
    UpdateCustomerProfileRequest
  >(CUSTOMER_PROFILE_PATH, {
    method: "PATCH",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  return response.data;
}
