const DEFAULT_TIMEOUT = 15000;

export interface RequestOptions extends RequestInit {
  timeout?: number;
  token?: string;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout ?? DEFAULT_TIMEOUT
  );

  try {
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      let message = "Error inesperado";

      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {}

      throw new Error(message);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}