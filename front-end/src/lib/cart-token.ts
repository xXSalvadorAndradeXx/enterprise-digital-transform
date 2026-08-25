const CART_TOKEN_STORAGE_KEY = "woden_cart_token";

export function readCartToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(CART_TOKEN_STORAGE_KEY);
}

export function saveCartToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return;
  }

  localStorage.setItem(
    CART_TOKEN_STORAGE_KEY,
    normalizedToken,
  );
}

export function clearCartToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
}