import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export async function GET() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/categories?publishedOnly=true`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "No se pudieron cargar las categorías." },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { message: "No pudimos conectarnos al servidor." },
      { status: 503 },
    );
  }
}
