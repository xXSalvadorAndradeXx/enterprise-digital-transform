import { cookies } from "next/headers";

import type {
  AuthUser,
  PublicAuthSession,
} from "@/types/auth/auth.types";

const AUTH_SESSION_COOKIE_NAME = "erp_session";
const AUTH_REFRESH_COOKIE_NAME = "erp_refresh_session";
const AUTH_PASSWORD_CHANGE_COOKIE_NAME =
  "erp_must_change_password";
const LEGACY_MOCK_SESSION_COOKIE_NAME = "erp_mock_session";
const AUTH_SESSION_MAX_AGE_SECONDS = 15 * 60;
const AUTH_REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

type SessionCookieStore = Awaited<ReturnType<typeof cookies>>;

interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

interface GetAuthSessionOptions {
  refreshOnUnauthorized?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getBackendApiUrl() {
  return process.env.BACKEND_API_URL?.replace(/\/+$/, "") ?? null;
}

function getCookieOptions(
  maxAgeSeconds = AUTH_SESSION_MAX_AGE_SECONDS,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

function deleteCookie(cookieStore: SessionCookieStore, cookieName: string) {
  try {
    cookieStore.delete(cookieName);
  } catch {
    // Server Components solo pueden leer cookies; Route Handlers si pueden borrarlas.
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getResponsePayload(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) {
    return null;
  }

  if (body.success === true && isRecord(body.data)) {
    return body.data;
  }

  return body;
}

function normalizeAuthTokens(body: unknown): AuthTokenPair | null {
  const payload = getResponsePayload(body);

  if (!payload) {
    return null;
  }

  const accessToken =
    typeof payload.accessToken === "string"
      ? payload.accessToken
      : typeof payload.access_token === "string"
        ? payload.access_token
        : null;
  const refreshToken =
    typeof payload.refreshToken === "string"
      ? payload.refreshToken
      : typeof payload.refresh_token === "string"
        ? payload.refresh_token
        : null;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    typeof value.id === "string"
      ? value.id
      : typeof value.userId === "string"
        ? value.userId
        : undefined;
  const email = typeof value.email === "string" ? value.email : undefined;
  const rol = typeof value.rol === "string" ? value.rol : undefined;

  if (!id || !email || !rol) {
    return null;
  }

  const nombre =
    typeof value.nombre === "string" && value.nombre.trim().length > 0
      ? value.nombre
      : undefined;
  const permissions = Array.isArray(value.permissions)
    ? value.permissions.filter(
        (permission): permission is string =>
          typeof permission === "string",
      )
    : undefined;

  return nombre
    ? {
        id,
        nombre,
        email,
        rol,
        ...(permissions ? { permissions } : {}),
      }
    : {
        id,
        email,
        rol,
        ...(permissions ? { permissions } : {}),
      };
}

function normalizeProfileUser(responseBody: unknown) {
  if (!isRecord(responseBody)) {
    return null;
  }

  if (isRecord(responseBody.user)) {
    return normalizeAuthUser(responseBody.user);
  }

  if (isRecord(responseBody.data) && isRecord(responseBody.data.user)) {
    return normalizeAuthUser(responseBody.data.user);
  }

  return normalizeAuthUser(responseBody);
}

// Sesion administrativa basada en cookies HttpOnly.
async function setSessionTokens({
  accessToken,
  refreshToken,
}: AuthTokenPair): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, accessToken, getCookieOptions());
  cookieStore.set(
    AUTH_REFRESH_COOKIE_NAME,
    refreshToken,
    getCookieOptions(AUTH_REFRESH_MAX_AGE_SECONDS),
  );
}

export async function setAuthToken(
  accessToken: string,
  mustChangePassword: boolean,
  refreshToken?: string,
): Promise<void> {
  const cookieStore = await cookies();

  deleteCookie(cookieStore, LEGACY_MOCK_SESSION_COOKIE_NAME);
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, accessToken, getCookieOptions());

  if (refreshToken) {
    cookieStore.set(
      AUTH_REFRESH_COOKIE_NAME,
      refreshToken,
      getCookieOptions(AUTH_REFRESH_MAX_AGE_SECONDS),
    );
  } else {
    deleteCookie(cookieStore, AUTH_REFRESH_COOKIE_NAME);
  }

  cookieStore.set(
    AUTH_PASSWORD_CHANGE_COOKIE_NAME,
    mustChangePassword ? "true" : "false",
    getCookieOptions(),
  );
}

export async function setMustChangePasswordRequirement(
  mustChangePassword: boolean,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_PASSWORD_CHANGE_COOKIE_NAME,
    mustChangePassword ? "true" : "false",
    getCookieOptions(),
  );
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
}

async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function deleteAuthToken(): Promise<void> {
  const cookieStore = await cookies();

  deleteCookie(cookieStore, AUTH_SESSION_COOKIE_NAME);
  deleteCookie(cookieStore, AUTH_REFRESH_COOKIE_NAME);
  deleteCookie(
    cookieStore,
    AUTH_PASSWORD_CHANGE_COOKIE_NAME,
  );
  deleteCookie(cookieStore, LEGACY_MOCK_SESSION_COOKIE_NAME);
}

export async function refreshAuthToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  const backendApiUrl = getBackendApiUrl();

  if (!refreshToken || !backendApiUrl) {
    await deleteAuthToken();
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const refreshResponse = await fetch(`${backendApiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!refreshResponse.ok) {
      await deleteAuthToken();
      return false;
    }

    const responseBody = await readJsonResponse(refreshResponse);
    const tokens = normalizeAuthTokens(responseBody);

    if (!tokens) {
      await deleteAuthToken();
      return false;
    }

    await setSessionTokens(tokens);

    return true;
  } catch {
    await deleteAuthToken();
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchProfileSession(
  backendApiUrl: string,
  accessToken: string,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(`${backendApiUrl}/users/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal,
  });
}

export async function getAuthSession(
  options: GetAuthSessionOptions = {},
): Promise<PublicAuthSession | null> {
  const accessToken = await getAuthToken();
  const backendApiUrl = getBackendApiUrl();
  const cookieStore = await cookies();

  if (!accessToken || !backendApiUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    let profileResponse = await fetchProfileSession(
      backendApiUrl,
      accessToken,
      controller.signal,
    );

    if (
      profileResponse.status === 401 &&
      options.refreshOnUnauthorized
    ) {
      const refreshed = await refreshAuthToken();

      if (!refreshed) {
        return null;
      }

      const refreshedAccessToken = await getAuthToken();

      if (!refreshedAccessToken) {
        return null;
      }

      profileResponse = await fetchProfileSession(
        backendApiUrl,
        refreshedAccessToken,
        controller.signal,
      );
    }

    if (profileResponse.status === 401 || !profileResponse.ok) {
      return null;
    }

    const responseBody = await readJsonResponse(profileResponse);
    const user = normalizeProfileUser(responseBody);

    if (!user) {
      return null;
    }

    return {
      user,
      isAuthenticated: true,
      mustChangePassword:
        cookieStore.get(
          AUTH_PASSWORD_CHANGE_COOKIE_NAME,
        )?.value === "true",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
