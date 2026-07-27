import { cookies } from "next/headers";

import type {
  AuthUser,
  PublicAuthSession,
} from "@/types/auth/auth.types";

const AUTH_SESSION_COOKIE_NAME = "erp_session";
const LEGACY_MOCK_SESSION_COOKIE_NAME = "erp_mock_session";
const AUTH_SESSION_MAX_AGE_SECONDS = 15 * 60;
const BACKEND_REQUEST_TIMEOUT_MS = 10_000;

type SessionCookieStore = Awaited<ReturnType<typeof cookies>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getBackendApiUrl() {
  return process.env.BACKEND_API_URL?.replace(/\/+$/, "") ?? null;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
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

  return nombre
    ? {
        id,
        nombre,
        email,
        rol,
      }
    : {
        id,
        email,
        rol,
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

// Sesión basada en access token mientras Backend no implemente refresh y logout con revocación.
export async function setAuthToken(accessToken: string): Promise<void> {
  const cookieStore = await cookies();

  deleteCookie(cookieStore, LEGACY_MOCK_SESSION_COOKIE_NAME);
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, accessToken, getCookieOptions());
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function deleteAuthToken(): Promise<void> {
  const cookieStore = await cookies();

  deleteCookie(cookieStore, AUTH_SESSION_COOKIE_NAME);
  deleteCookie(cookieStore, LEGACY_MOCK_SESSION_COOKIE_NAME);
}

export async function getAuthSession(): Promise<PublicAuthSession | null> {
  const accessToken = await getAuthToken();
  const backendApiUrl = getBackendApiUrl();

  if (!accessToken || !backendApiUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const profileResponse = await fetch(`${backendApiUrl}/users/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

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
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
