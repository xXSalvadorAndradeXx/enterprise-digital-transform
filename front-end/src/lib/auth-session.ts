export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

export type AuthUser = {
  id?: number;
  nombre?: string;
  email?: string;
  rol?: string;
};

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

export function saveAuthSession(responseData: unknown) {
  if (
    !canUseStorage() ||
    typeof responseData !== "object" ||
    responseData === null
  ) {
    return;
  }

  if ("access_token" in responseData) {
    const accessToken = (responseData as { access_token?: unknown })
      .access_token;

    if (typeof accessToken === "string") {
      localStorage.setItem("access_token", accessToken);
    }
  }

  if ("user" in responseData) {
    const user = (responseData as { user?: unknown }).user;

    if (typeof user === "object" && user !== null) {
      localStorage.setItem("user", JSON.stringify(user));
    }
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
