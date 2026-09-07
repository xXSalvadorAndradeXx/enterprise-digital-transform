import type { User } from "@/types/auth/user.types";

export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

export type AuthUser = Partial<User>;

export interface SessionUserProfile {
  id: string | number;
  name: string;
  email: string;
  phone: string | null;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function notifyAuthSessionChanged() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function readAccessToken() {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem("access_token");
}

export function hasActiveSession() {
  return Boolean(readAccessToken());
}

export function readSessionUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser: unknown = JSON.parse(storedUser);

    if (typeof parsedUser === "object" && parsedUser !== null) {
      return parsedUser as AuthUser;
    }
  } catch {
    return null;
  }

  return null;
}

export function readAuthSessionIdentity(): string | null {
  const accessToken = readAccessToken();

  if (!accessToken) {
    return null;
  }

  const sessionUser = readSessionUser() as Record<string, unknown> | null;
  const userId = sessionUser?.id;

  if (typeof userId === "string" && userId.trim()) {
    return `user:${userId}`;
  }

  if (typeof userId === "number" && Number.isFinite(userId)) {
    return `user:${userId}`;
  }

  return `token:${accessToken}`;
}

export function syncSessionUserProfile(
  profile: SessionUserProfile,
  expectedIdentity: string | null,
): boolean {
  const currentIdentity = readAuthSessionIdentity();

  if (!currentIdentity || currentIdentity !== expectedIdentity) {
    return false;
  }

  const storedUser = readSessionUser();
  const currentUser =
    storedUser && !Array.isArray(storedUser)
      ? (storedUser as Record<string, unknown>)
      : null;
  const currentUserId = currentUser?.id;

  if (
    currentUserId !== undefined &&
    currentUserId !== null &&
    String(currentUserId) !== String(profile.id)
  ) {
    return false;
  }

  const updatedUser: Record<string, unknown> = {
    ...(currentUser ?? {}),
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
  };
  const nameAliases = ["nombre", "name", "fullName"] as const;
  const existingNameAliases = nameAliases.filter(
    (alias) => currentUser && alias in currentUser,
  );

  if (existingNameAliases.length === 0) {
    updatedUser.fullName = profile.name;
  } else {
    existingNameAliases.forEach((alias) => {
      updatedUser[alias] = profile.name;
    });
  }

  if (JSON.stringify(currentUser) === JSON.stringify(updatedUser)) {
    return true;
  }

  localStorage.setItem("user", JSON.stringify(updatedUser));
  notifyAuthSessionChanged();

  return true;
}

export function saveAuthSession(responseData: unknown) {
  if (
    !canUseStorage() ||
    typeof responseData !== "object" ||
    responseData === null
  ) {
    return;
  }

  let accessToken: unknown = null;

  if ("accessToken" in responseData) {
    accessToken = (responseData as { accessToken?: unknown }).accessToken;
  } else if ("access_token" in responseData) {
    accessToken = (responseData as { access_token?: unknown }).access_token;
  }

  if (typeof accessToken === "string") {
    localStorage.setItem("access_token", accessToken);
  }

  let user: unknown = null;

  if ("customer" in responseData) {
    user = (responseData as { customer?: unknown }).customer;
  } else if ("user" in responseData) {
    user = (responseData as { user?: unknown }).user;
  }

  if (typeof user === "object" && user !== null) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  notifyAuthSessionChanged();
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  notifyAuthSessionChanged();
}
