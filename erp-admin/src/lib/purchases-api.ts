import { NextResponse } from "next/server";

import { getAuthToken } from "@/lib/session";

const TIMEOUT_MS = 10_000;

export async function forwardPurchasesRequest(path: string, init: RequestInit): Promise<NextResponse> {
  const token = await getAuthToken();
  const baseUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!token) return NextResponse.json({ message: "No existe una sesión activa." }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ message: "El servicio de compras no está configurado." }, { status: 500 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return NextResponse.json(await response.json(), { status: response.status });
    return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: { "Content-Type": contentType } });
  } catch (error) {
    const timeoutError = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({ message: timeoutError ? "La solicitud de compras superó el tiempo de espera." : "No se pudo conectar con el servicio de compras." }, { status: timeoutError ? 504 : 503 });
  } finally {
    clearTimeout(timeout);
  }
}
